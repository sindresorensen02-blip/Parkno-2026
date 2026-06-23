// POST /api/waitlist — Parkno pre-launch waitlist (name + email only).
//
// A signup is durable the moment it lands in Supabase. The founder
// notification + user confirmation emails are best-effort on top. The client
// treats anything other than a confirmed write (or a known-duplicate) as a
// LOUD failure and falls back to mailto — we never silently drop a signup.
//
// No npm deps on purpose: we call Supabase (PostgREST) and Resend over their
// REST APIs with built-in fetch. Mirrors the patterns in api/lead.js.
//
// Required env (Vercel project settings):
//   SUPABASE_URL                e.g. https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY   service role key (server-only, never client)
// Optional env:
//   RESEND_API_KEY              enables notification + confirmation email
//   LEAD_NOTIFY_TO              founder inbox (default kontakt@parkno.no)
//   LEAD_FROM                   verified sender (default Parkno <noreply@parkno.no>)

const MAX_BODY_BYTES = 4 * 1024;
const RATE_WINDOW_MIN = 10;
const RATE_MAX_PER_IP = 5;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Intent captured on the landing page: 'park' (find parking) | 'host' (rent out a spot).
const ROLES = new Set(['park', 'host']);

function clean(v, max = 200) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function getIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) return xff.split(',')[0].trim();
  return req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : '';
}

function validate(b) {
  const errors = [];
  // Name is optional — only a valid e-post is required to join the list.
  if (!EMAIL_RE.test(b.email)) errors.push('gyldig e-post');
  return errors;
}

async function supabase(path, init, env) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(init && init.headers),
    },
  });
  return res;
}

async function sendEmail(env, to, subject, html) {
  if (!env.RESEND_API_KEY || !to) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.LEAD_FROM || 'Parkno <noreply@parkno.no>',
        to: [to],
        subject,
        html,
      }),
    });
  } catch (err) {
    // Email is best-effort; the signup is already persisted. Log, don't fail.
    console.error('waitlist email failed:', err && err.message);
  }
}

function esc(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const env = process.env;
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('waitlist: SUPABASE env not configured');
    return res.status(503).json({ ok: false, error: 'not_configured' });
  }

  // Body (Vercel parses JSON; guard size + parse defensively).
  let body = req.body;
  try {
    if (typeof body === 'string') {
      if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
        return res.status(413).json({ ok: false, error: 'too_large' });
      }
      body = JSON.parse(body);
    }
  } catch {
    return res.status(400).json({ ok: false, error: 'bad_json' });
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ ok: false, error: 'bad_request' });
  }

  // Honeypot — bots fill hidden "company". Pretend success, store nothing.
  if (clean(body.company)) {
    return res.status(200).json({ ok: true });
  }

  const role = clean(body.role, 16);
  const entry = {
    first_name: clean(body.first_name, 80),
    last_name: clean(body.last_name, 80),
    email: clean(body.email, 160).toLowerCase(),
    role: ROLES.has(role) ? role : 'park',
    source: clean(body.source, 40) || 'waitlist.html',
  };

  const errors = validate(entry);
  if (errors.length) {
    return res.status(422).json({ ok: false, error: 'validation', fields: errors });
  }

  const ip = getIp(req);
  entry.ip = ip || null;
  entry.user_agent = clean(req.headers['user-agent'], 300) || null;

  // Lightweight per-IP rate limit using the store we already have.
  if (ip) {
    try {
      const since = new Date(Date.now() - RATE_WINDOW_MIN * 60_000).toISOString();
      const q = `waitlist?select=id&ip=eq.${encodeURIComponent(ip)}&created_at=gte.${encodeURIComponent(since)}`;
      const r = await supabase(q, { method: 'GET' }, env);
      if (r.ok) {
        const rows = await r.json();
        if (Array.isArray(rows) && rows.length >= RATE_MAX_PER_IP) {
          return res.status(429).json({ ok: false, error: 'rate_limited' });
        }
      }
    } catch {
      // If the rate check itself fails, don't block a real signup.
    }
  }

  // Durable write — this is the success boundary. A duplicate email (unique
  // index violation, PostgREST 409) is a success too: they're already on the list.
  let alreadyOnList = false;
  try {
    const r = await supabase('waitlist', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(entry),
    }, env);
    if (r.status === 409) {
      alreadyOnList = true;
    } else if (!r.ok) {
      const detail = await r.text().catch(() => '');
      console.error('waitlist insert failed:', r.status, detail);
      return res.status(502).json({ ok: false, error: 'store_failed' });
    }
  } catch (err) {
    console.error('waitlist insert threw:', err && err.message);
    return res.status(502).json({ ok: false, error: 'store_failed' });
  }

  // Best-effort notifications (never affect the response status). Skip the
  // founder ping for duplicates — they're already known.
  const fullName = `${entry.first_name} ${entry.last_name}`.trim();
  const displayName = fullName || entry.email;
  const greeting = entry.first_name ? `Hei ${esc(entry.first_name)},` : 'Hei,';
  const roleLabel = entry.role === 'host' ? 'Leie ut plass' : 'Parkere';

  if (!alreadyOnList) {
    await sendEmail(
      env,
      env.LEAD_NOTIFY_TO || 'kontakt@parkno.no',
      `Ny på ventelisten — ${displayName}`,
      `<h2 style="font-family:Inter,system-ui,sans-serif">Ny Parkno-venteliste</h2>
       <table style="font-family:Inter,system-ui,sans-serif;font-size:14px">
         <tr><td style="padding:4px 12px 4px 0;color:#7B8589">Navn</td><td style="padding:4px 0"><b>${esc(fullName) || '—'}</b></td></tr>
         <tr><td style="padding:4px 12px 4px 0;color:#7B8589">E-post</td><td style="padding:4px 0"><b>${esc(entry.email)}</b></td></tr>
         <tr><td style="padding:4px 12px 4px 0;color:#7B8589">Vil</td><td style="padding:4px 0"><b>${esc(roleLabel)}</b></td></tr>
       </table>`
    );

    await sendEmail(
      env,
      entry.email,
      'Du står på ventelisten til Parkno',
      `<div style="font-family:Inter,system-ui,sans-serif;font-size:15px;color:#111416;line-height:1.5">
         <p>${greeting}</p>
         <p>Takk! Du står nå på ventelisten til Parkno. Vi gir deg beskjed så snart
         appen er klar i Bergen.</p>
         <p>Spørsmål? Svar på denne e-posten eller skriv til
         <a href="mailto:kontakt@parkno.no">kontakt@parkno.no</a>.</p>
         <p style="color:#7B8589">— Parkno</p>
       </div>`
    );
  }

  return res.status(200).json({ ok: true, already: alreadyOnList });
};
