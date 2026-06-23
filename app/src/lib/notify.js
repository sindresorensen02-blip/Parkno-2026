import { supabase } from './supabase';

export async function notifyUser(userId, { title, body, data = {} }) {
  if (!userId) return;
  const { data: profile } = await supabase
    .from('profiles')
    .select('push_token')
    .eq('id', userId)
    .maybeSingle();

  const token = profile?.push_token;
  if (!token) return;

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept-Encoding': 'gzip, deflate' },
    body: JSON.stringify({ to: token, title, body, data, sound: 'default' }),
  });
}
