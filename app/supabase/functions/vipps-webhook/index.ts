// DEPLOY: supabase functions deploy vipps-webhook

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Timing-safe byte comparison to prevent signature oracle attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function verifySignature(body: string, signature: string): Promise<boolean> {
  const secret = Deno.env.get('VIPPS_WEBHOOK_SECRET');
  if (!secret) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  const hex = Array.from(new Uint8Array(mac))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return timingSafeEqual(hex, signature.toLowerCase());
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('X-Vipps-Signature') ?? '';

    const valid = await verifySignature(rawBody, signature);
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = JSON.parse(rawBody);
    const { event, paymentReference } = body;

    if (event === 'PAYMENT_CAPTURED') {
      const { data, error } = await supabase
        .from('reservations')
        .update({ payment_status: 'paid', status: 'confirmed' })
        .eq('payment_reference', paymentReference)
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) {
        console.warn(`PAYMENT_CAPTURED: no reservation found for reference ${paymentReference}`);
      }

    } else if (event === 'PAYMENT_CANCELLED') {
      const { data, error } = await supabase
        .from('reservations')
        .update({ payment_status: 'refunded', status: 'cancelled' })
        .eq('payment_reference', paymentReference)
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) {
        console.warn(`PAYMENT_CANCELLED: no reservation found for reference ${paymentReference}`);
      }

    } else {
      return new Response(JSON.stringify({ error: 'Unknown event type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('vipps-webhook error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
