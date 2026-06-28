// DEPLOY: supabase functions deploy vipps-login
//
// Brokers the Vipps OIDC login: exchanges the auth code for verified userinfo,
// resolves/creates the Supabase auth user (auto-link on verified email),
// updates the profile (vipps_sub, phone, phone_verified_at), and mints a
// session. All secrets (Vipps client secret, service-role key) stay here.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { VippsEmailUnverified, getVippsUserinfoStub, resolveAccount } from './logic.js';

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const anon = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!,
);

// STUB SEAM: in stub mode return the fixed identity; otherwise exchange the
// code with Vipps for real userinfo. Real branch is intentionally minimal —
// it is filled in at merchant-onboarding cutover.
async function getVippsUserinfo(code: string) {
  if (Deno.env.get('VIPPS_STUB') === 'true') {
    return getVippsUserinfoStub();
  }
  const tokenRes = await fetch(Deno.env.get('VIPPS_TOKEN_URL')!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: Deno.env.get('VIPPS_CLIENT_ID')!,
      client_secret: Deno.env.get('VIPPS_CLIENT_SECRET')!,
      redirect_uri: Deno.env.get('VIPPS_REDIRECT_URI')!,
    }),
  });
  if (!tokenRes.ok) throw new Error('vipps token exchange failed');
  const { access_token } = await tokenRes.json();
  const infoRes = await fetch(Deno.env.get('VIPPS_USERINFO_URL')!, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!infoRes.ok) throw new Error('vipps userinfo failed');
  return await infoRes.json();
}

// Adapter passed to resolveAccount: wraps real service-role queries.
function makeDb() {
  return {
    findProfileByVippsSub: async (sub: string) => {
      const { data } = await admin.from('profiles').select('id').eq('vipps_sub', sub).maybeSingle();
      return data?.id ?? null;
    },
    findAuthUserByEmail: async (email: string) => {
      // GoTrue admin: page through users and match email (v2 has no direct getByEmail).
      const { data } = await admin.auth.admin.listUsers();
      const u = data?.users?.find((x) => x.email?.toLowerCase() === email.toLowerCase());
      return u?.id ?? null;
    },
    createAuthUser: async (email: string, name: string) => {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: name },
      });
      if (error) throw error;
      return data.user!.id;
    },
  };
}

// Mint a session for a resolved user via the v2 magic-link pattern: generate a
// magiclink, then verify its token hash to obtain access/refresh tokens.
async function issueSession(email: string) {
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (error) throw error;
  if (!data.properties) throw new Error('generateLink returned no properties');
  const tokenHash = data.properties.hashed_token;
  const { data: verified, error: vErr } = await anon.auth.verifyOtp({
    type: 'magiclink',
    token_hash: tokenHash,
  });
  if (vErr) throw vErr;
  if (!verified.session) throw new Error('verifyOtp returned no session');
  return {
    access_token: verified.session.access_token,
    refresh_token: verified.session.refresh_token,
  };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }
  try {
    const { code } = await req.json();
    if (!code) return new Response(JSON.stringify({ error: 'missing code' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const userinfo = await getVippsUserinfo(code);
    const db = makeDb();
    const { userId } = await resolveAccount(userinfo, db);

    // Update profile: link identity + verify phone. Profile row exists via the
    // handle_new_user trigger when the user was just created.
    const { data: updatedRows, error: updateErr } = await admin.from('profiles').update({
      vipps_sub: userinfo.sub,
      phone: userinfo.phone_number,
      phone_verified_at: new Date().toISOString(),
    }).eq('id', userId).select('id');
    if (updateErr) throw updateErr;
    if (!updatedRows || updatedRows.length === 0) throw new Error('profile row missing for user ' + userId);

    const session = await issueSession(userinfo.email);
    return new Response(JSON.stringify(session), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    if (err instanceof VippsEmailUnverified) {
      return new Response(JSON.stringify({ error: 'vipps_email_unverified' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    console.error('vipps-login error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
