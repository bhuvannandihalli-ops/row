const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text, remindAt, url } = req.body;
  if (!text || !remindAt) return res.status(400).json({ error: 'Missing text or remindAt' });

  const { error } = await supabase.from('reminders').insert({
    text,
    remind_at: remindAt,
    sent: false,
    url: url || '/void.html',
  });

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ ok: true });
};
