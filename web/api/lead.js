// POST /api/lead — Parkno driver/host lead capture (PRD §6.1).
//
// Concierge MVP: a lead is durable the moment it lands in Supabase. The
// founder notification + user confirmation emails are best-effort on top.
// The client treats anything other than a confirmed Supabase write as a
// LOUD failure and falls back to mailto — we never silently drop a lead.
//
// No npm deps on purpose (repo has no package.json): we call Supabase
// (PostgREST) and Resend over their REST APIs with built-in fetch.
//
// Required env (Vercel project settings):
//   SUPABASE_URL                e.g. https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY   service role key (server-only, never client)
// Optional env:
//   RESEND_API_KEY              enables notification + confirmation email
//   LEAD_NOTIFY_TO              founder inbox (default kontakt@parkno.no)
//   LEAD_FROM                   verified sender (default Parkno <noreply@parkno.no>)

const MAX_BODY_BYTES = 8 * 1024;
const RATE_WINDOW_MIN = 10;
const RATE_MAX_PER_IP = 5;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(v, max = 200) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function getIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) return xff.split(',')[0].trim();
  return req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : '';
}

function validate(role, b) {
  const errors = [];
  const required = (key, label) => { if (!b[key]) errors.push(label); };

  required('first_name', 'fornavn');
  required('last_name', 'etternavn');
  if (!EMAIL_RE.test(b.email)) errors.push('gyldig e-post');
  if (b.phone.replace(/\D/g, '').length < 8) errors.push('mobilnummer');
  if (b.consent !== true) errors.push('samtykke til vilkår');

  if (role === 'driver') {
    required('neighborhood', 'område');
    required('vehicle', 'bil');
    required('plate', 'skiltnummer');
  } else if (role === 'host') {
    required('space_address', 'adresse for plassen');
    required('space_type', 'type plass');
    required('availability', 'tilgjengelighet');
    required('expected_price', 'ønsket pris');
  } else {
    errors.push('kontotype');
  }
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
    // Email is best-effort; the lead is already persisted. Log, don't fail.
    console.error('lead email failed:', err && err.message);
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
    console.error('lead: SUPABASE env not configured');
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
  const lead = {
    role,
    first_name: clean(body.first_name, 80),
    last_name: clean(body.last_name, 80),
    email: clean(body.email, 160).toLowerCase(),
    phone: clean(body.phone, 32),
    neighborhood: clean(body.neighborhood, 120) || null,
    vehicle: clean(body.vehicle, 80) || null,
    plate: clean(body.plate, 16).toUpperCase() || null,
    space_address: clean(body.space_address, 200) || null,
    space_type: clean(body.space_type, 40) || null,
    availability: clean(body.availability, 60) || null,
    expected_price: clean(body.expected_price, 12) || null,
    consent: body.consent === true,
    source: clean(body.source, 40) || 'register.html',
  };

  const errors = validate(role, lead);
  if (errors.length) {
    return res.status(422).json({ ok: false, error: 'validation', fields: errors });
  }

  const ip = getIp(req);
  lead.ip = ip || null;
  lead.user_agent = clean(req.headers['user-agent'], 300) || null;

  // Lightweight per-IP rate limit using the store we already have.
  if (ip) {
    try {
      const since = new Date(Date.now() - RATE_WINDOW_MIN * 60_000).toISOString();
      const q = `leads?select=id&ip=eq.${encodeURIComponent(ip)}&created_at=gte.${encodeURIComponent(since)}`;
      const r = await supabase(q, { method: 'GET' }, env);
      if (r.ok) {
        const rows = await r.json();
        if (Array.isArray(rows) && rows.length >= RATE_MAX_PER_IP) {
          return res.status(429).json({ ok: false, error: 'rate_limited' });
        }
      }
    } catch {
      // If the rate check itself fails, don't block a real lead.
    }
  }

  // Durable write — this is the success boundary.
  let inserted;
  try {
    const r = await supabase('leads', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(lead),
    }, env);
    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      console.error('lead insert failed:', r.status, detail);
      return res.status(502).json({ ok: false, error: 'store_failed' });
    }
    inserted = await r.json().catch(() => null);
  } catch (err) {
    console.error('lead insert threw:', err && err.message);
    return res.status(502).json({ ok: false, error: 'store_failed' });
  }

  // Best-effort notifications (never affect the response status).
  const isDriver = role === 'driver';
  const rows = [
    ['Type', isDriver ? 'Sjåfør' : 'Utleier'],
    ['Navn', `${lead.first_name} ${lead.last_name}`],
    ['E-post', lead.email],
    ['Telefon', lead.phone],
    ['Område', lead.neighborhood],
    ...(isDriver
      ? [['Bil', lead.vehicle], ['Skilt', lead.plate]]
      : [['Adresse', lead.space_address], ['Plasstype', lead.space_type],
         ['Tilgjengelighet', lead.availability], ['Ønsket pris', lead.expected_price]]),
  ].filter(([, v]) => v);
  const tableHtml = rows
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#7B8589">${esc(k)}</td><td style="padding:4px 0"><b>${esc(v)}</b></td></tr>`)
    .join('');

  await sendEmail(
    env,
    env.LEAD_NOTIFY_TO || 'kontakt@parkno.no',
    `Ny ${isDriver ? 'sjåfør' : 'utleier'}-registrering — ${lead.first_name} ${lead.last_name}`,
    `<h2 style="font-family:Inter,system-ui,sans-serif">Ny Parkno-registrering</h2>
     <table style="font-family:Inter,system-ui,sans-serif;font-size:14px">${tableHtml}</table>
     <p style="color:#7B8589;font-size:12px">Lead-ID: ${esc((inserted && inserted[0] && inserted[0].id) || '—')}</p>`
  );

  await sendEmail(
    env,
    lead.email,
    'Takk for registreringen hos Parkno',
    `<div style="font-family:Inter,system-ui,sans-serif;font-size:15px;color:#111416;line-height:1.5">
       <p>Hei ${esc(lead.first_name)},</p>
       <p>Takk! Vi har mottatt registreringen din som <b>${isDriver ? 'sjåfør' : 'utleier'}</b> i Bergen.
       Vi tar kontakt for verifisering og neste steg så snart som mulig.</p>
       <p>Spørsmål? Svar på denne e-posten eller skriv til
       <a href="mailto:kontakt@parkno.no">kontakt@parkno.no</a>.</p>
       <p style="color:#7B8589">— Parkno</p>
     </div>`
  );

  return res.status(200).json({ ok: true });
};
