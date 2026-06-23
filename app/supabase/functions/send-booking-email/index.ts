import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM = 'MinPlass <noreply@minplass.eu>';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } });
  }

  const { renterEmail, renterName, address, startStr, endStr, durationStr, total, refLabel } = await req.json();

  const html = `<!DOCTYPE html>
<html lang="nb">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reservasjon bekreftet</title></head>
<body style="margin:0;padding:0;background:#F7F7F2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F7F2;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(17,20,22,0.08);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#10B981,#14B8A6,#2563EB);padding:36px 40px;text-align:center;">
          <div style="font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.5px;">MinPlass</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px;">Din parkeringspartner i Bergen</div>
        </td></tr>

        <!-- Confirmation icon + title -->
        <tr><td style="padding:40px 40px 0;text-align:center;">
          <div style="width:64px;height:64px;border-radius:32px;background:linear-gradient(135deg,#10B981,#14B8A6);display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">
            <span style="color:#fff;font-size:28px;line-height:1;">✓</span>
          </div>
          <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#111416;letter-spacing:-0.5px;">Reservasjon bekreftet!</h1>
          <p style="margin:0;font-size:15px;color:#7B8589;">Hei ${renterName || 'der'}, parkeringsplassen din er reservert.</p>
        </td></tr>

        <!-- Booking details -->
        <tr><td style="padding:32px 40px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F7F2;border-radius:16px;overflow:hidden;">
            <tr><td style="padding:20px 24px;border-bottom:1px solid rgba(17,20,22,0.06);">
              <div style="font-size:10px;font-weight:700;color:#7B8589;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">Adresse</div>
              <div style="font-size:16px;font-weight:700;color:#111416;">${address}</div>
            </td></tr>
            <tr><td style="padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding:16px 24px;border-bottom:1px solid rgba(17,20,22,0.06);border-right:1px solid rgba(17,20,22,0.06);">
                    <div style="font-size:10px;font-weight:700;color:#7B8589;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">Starter</div>
                    <div style="font-size:20px;font-weight:800;color:#111416;">${startStr}</div>
                  </td>
                  <td width="50%" style="padding:16px 24px;border-bottom:1px solid rgba(17,20,22,0.06);">
                    <div style="font-size:10px;font-weight:700;color:#7B8589;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">Slutter</div>
                    <div style="font-size:20px;font-weight:800;color:#111416;">${endStr}</div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding:16px 24px;border-right:1px solid rgba(17,20,22,0.06);">
                    <div style="font-size:10px;font-weight:700;color:#7B8589;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">Varighet</div>
                    <div style="font-size:20px;font-weight:800;color:#111416;">${durationStr}</div>
                  </td>
                  <td width="50%" style="padding:16px 24px;">
                    <div style="font-size:10px;font-weight:700;color:#7B8589;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">Totalt betalt</div>
                    <div style="font-size:20px;font-weight:800;color:#10B981;">${total} kr</div>
                  </td>
                </tr>
              </table>
            </td></tr>
            ${refLabel ? `<tr><td style="padding:14px 24px;text-align:center;">
              <span style="display:inline-block;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.25);border-radius:999px;padding:6px 16px;font-size:12px;font-weight:700;color:#0D7A55;letter-spacing:0.4px;">Bestillingsnr. ${refLabel}</span>
            </td></tr>` : ''}
          </table>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:0 40px 40px;text-align:center;">
          <p style="font-size:14px;color:#7B8589;line-height:1.6;margin:0 0 24px;">God parkering! Åpne MinPlass-appen for å se alle detaljer, forlenge bookingen eller navigere til plassen.</p>
          <div style="background:rgba(17,20,22,0.04);border-radius:12px;padding:16px 20px;text-align:left;">
            <span style="font-size:12px;color:#7B8589;">Spørsmål? Kontakt oss på </span>
            <a href="mailto:hjelp@minplass.eu" style="color:#10B981;font-weight:600;text-decoration:none;">hjelp@minplass.eu</a>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 40px;border-top:1px solid rgba(17,20,22,0.06);text-align:center;">
          <p style="margin:0;font-size:12px;color:#BCC5CB;">© ${new Date().getFullYear()} MinPlass AS · Bergen, Norge</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({
      from: FROM,
      to: renterEmail,
      subject: `Reservasjon bekreftet – ${address}`,
      html,
    }),
  });

  return new Response(JSON.stringify({ ok: res.ok }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    status: res.ok ? 200 : 500,
  });
});
