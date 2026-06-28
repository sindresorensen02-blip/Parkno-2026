import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';
import { VIPPS_STUB, LOGIN_FN_URL, CLIENT_ID, AUTHORIZE_URL, REDIRECT_URI } from './vippsConfig';

// Drive the Vipps OIDC redirect, exchange the code via the edge function, and
// set the resulting Supabase session. Returns { error } / { cancelled } / {}.
export async function startVippsLogin() {
  let code = 'stub-code';

  // In stub mode we skip the real browser round-trip — the edge function
  // ignores the code and returns the stub identity. In real mode we open Vipps.
  if (!VIPPS_STUB) {
    const authUrl =
      `${AUTHORIZE_URL}?client_id=${encodeURIComponent(CLIENT_ID)}` +
      `&response_type=code&scope=openid%20name%20phoneNumber%20email` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);
    if (result.type === 'cancel' || result.type === 'dismiss') return { cancelled: true };
    if (result.type !== 'success' || !result.url) return { error: 'Vipps-innlogging ble avbrutt.' };
    const returned = new URL(result.url).searchParams.get('code');
    if (!returned) return { error: 'Mangler kode fra Vipps.' };
    code = returned;
  }

  let res;
  try {
    res = await fetch(LOGIN_FN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ code }),
    });
  } catch {
    return { error: 'Kunne ikke nå Vipps-tjenesten. Prøv igjen.' };
  }

  if (res.status === 401) return { error: 'Kunne ikke verifisere Vipps-kontoen din.' };
  if (!res.ok) return { error: 'Kunne ikke logge inn med Vipps. Prøv igjen.' };

  const { access_token, refresh_token } = await res.json();
  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) return { error: 'Kunne ikke opprette økt. Prøv igjen.' };
  return {};
}
