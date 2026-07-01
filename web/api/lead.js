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
    // The landing-page modal (source 'index-hero') is a lightweight interest
    // capture — name/email/phone only. The full register.html host form still
    // requires the spot details so we have enough to verify and list it.
    if (b.source !== 'index-hero') {
      required('space_address', 'adresse for plassen');
      required('space_type', 'type plass');
      required('availability', 'tilgjengelighet');
      required('expected_price', 'ønsket pris');
    }
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

// Registration confirmation email sent to the customer (Norwegian welcome mail).
function welcomeEmailHtml(firstName) {
  const name = esc(firstName || '');
  return `<!DOCTYPE html>
<html lang="nb" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Velkommen til Parkno</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a { color: #0489FC; }

    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; }
      .px { padding-left: 24px !important; padding-right: 24px !important; }
      .py { padding-top: 28px !important; padding-bottom: 28px !important; }
      .h1 { font-size: 24px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#eef2f5;">
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#eef2f5; opacity:0;">
    Din plass, Dine penger &ndash; nå er du i gang.&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef2f5;">
    <tr>
      <td align="center" style="padding:32px 12px;">

        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">

          <tr>
            <td bgcolor="#0489FC" style="background-color:#0489FC; background-image:linear-gradient(135deg, #0489FC 0%, #11B7BA 52%, #00D57C 100%); border-radius:18px 18px 0 0; padding:40px 40px 34px 40px; text-align:center;" class="px">
              <div style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:30px; font-weight:800; letter-spacing:-0.5px; color:#ffffff; line-height:1;">Parkno</div>
              <div style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; font-weight:500; color:#ffffff; opacity:0.92; margin-top:8px;">Din plass, Dine penger.</div>
            </td>
          </tr>

          <tr>
            <td bgcolor="#ffffff" style="background-color:#ffffff; padding:40px; font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;" class="px py">

              <h1 class="h1" style="margin:0 0 20px 0; font-size:26px; line-height:1.25; font-weight:700; color:#111827;">Hei ${name}, velkommen til Parkno!</h1>

              <p style="margin:0 0 18px 0; font-size:16px; line-height:1.6; color:#374151;">
                Takk for at du registrerte deg &ndash; vi er glade for å ha deg med fra starten.
              </p>

              <p style="margin:0 0 24px 0; font-size:16px; line-height:1.6; color:#374151;">
                Parkno gjør det enkelt å leie ut parkeringsplassen din når den står ledig, eller finne en plass når du selv trenger det. Trygt, enkelt og direkte mellom folk i nabolaget.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px 0;">
                <tr>
                  <td style="padding:16px 18px; background-color:#f5f9fb; border-radius:12px;">
                    <p style="margin:0 0 6px 0; font-size:15px; line-height:1.5; color:#374151;">
                      <span style="color:#00D57C; font-weight:700;">&#8226;</span>&nbsp;
                      <strong style="color:#111827;">Som vert</strong> &ndash; leier du ut plassen din og tjener penger på den.
                    </p>
                    <p style="margin:0; font-size:15px; line-height:1.5; color:#374151;">
                      <span style="color:#0489FC; font-weight:700;">&#8226;</span>&nbsp;
                      <strong style="color:#111827;">Som sjåfør</strong> &ndash; finner og booker du parkering raskt og uten stress.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 18px 0; font-size:16px; line-height:1.6; color:#374151;">
                Vi kommer til hele Norge, og du er blant de aller første som er med. Har du spørsmål eller gode innspill? Bare svar på denne e-posten, eller ta kontakt på <a href="mailto:kontakt@parkno.no" style="color:#0489FC; text-decoration:none;">kontakt@parkno.no</a> &ndash; vi hører gjerne fra deg.
              </p>

              <p style="margin:0; font-size:16px; line-height:1.6; color:#374151;">
                Vi sees på Parkno!<br>
                <strong style="color:#111827;">Sindre</strong><br>
                <span style="color:#6b7280; font-size:14px;">Parkno</span>
              </p>

            </td>
          </tr>

          <tr>
            <td style="background-color:#ffffff; border-radius:0 0 18px 18px; padding:0 40px 32px 40px;" class="px">
              <div style="border-top:1px solid #eceff2; padding-top:24px; text-align:center; font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                <p style="margin:0 0 6px 0; font-size:13px; line-height:1.5; color:#9aa4b0;">
                  <strong style="color:#6b7280;">Parkno</strong> &middot; Bergen, Norge<br>
                  <a href="mailto:kontakt@parkno.no" style="color:#9aa4b0; text-decoration:none;">kontakt@parkno.no</a>
                </p>
                <p style="margin:0; font-size:12px; line-height:1.5; color:#b6bec8;">
                  Du mottar denne e-posten fordi du registrerte deg hos Parkno.
                </p>
              </div>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
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
    'Velkommen til Parkno',
    welcomeEmailHtml(lead.first_name)
  );

  return res.status(200).json({ ok: true });
};
