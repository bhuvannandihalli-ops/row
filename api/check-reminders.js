const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

webpush.setVapidDetails(
  'mailto:bhuvan.nandihalli@gmail.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).end();
  }

  // Fetch due reminders
  const { data: reminders, error: rErr } = await supabase
    .from('reminders')
    .select('*')
    .lte('remind_at', new Date().toISOString())
    .eq('sent', false);

  if (rErr) return res.status(500).json({ error: rErr.message });
  if (!reminders || reminders.length === 0) return res.status(200).json({ sent: 0 });

  // Fetch all push subscriptions
  const { data: subs, error: sErr } = await supabase
    .from('push_subscriptions')
    .select('*');

  if (sErr) return res.status(500).json({ error: sErr.message });
  if (!subs || subs.length === 0) {
    // Mark reminders sent anyway so they don't loop
    await supabase.from('reminders').update({ sent: true }).in('id', reminders.map(r => r.id));
    return res.status(200).json({ sent: 0, note: 'No subscribers' });
  }

  const expiredEndpoints = [];

  for (const reminder of reminders) {
    const payload = JSON.stringify({
      title: '🔔 Reminder',
      body: reminder.text,
      url: reminder.url || '/void.html',
      tag: `reminder-${reminder.id}`,
    });

    for (const sub of subs) {
      try {
        await webpush.sendNotification(sub.subscription, payload);
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          expiredEndpoints.push(sub.endpoint);
        }
      }
    }

    await supabase.from('reminders').update({ sent: true }).eq('id', reminder.id);
  }

  // Clean up expired subscriptions
  if (expiredEndpoints.length > 0) {
    await supabase.from('push_subscriptions').delete().in('endpoint', expiredEndpoints);
  }

  res.status(200).json({ sent: reminders.length });
};
