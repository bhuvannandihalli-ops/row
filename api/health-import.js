const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Maps Health Auto Export metric names → our column names
function mapMetric(rawName, qty, row) {
  const n = rawName.toLowerCase();
  if (n.includes('step'))                                      row.steps = Math.round(qty);
  else if (n.includes('resting') && n.includes('heart'))      row.resting_hr = qty;
  else if (n.includes('sleep') && !n.includes('stage'))       row.sleep_hours = qty;
  else if (n.includes('active') && n.includes('energ'))       row.active_calories = Math.round(qty);
  else if (n.includes('heart_rate_variability') || n === 'hrv') row.hrv = qty;
  else if (n.includes('body_mass') || (n.includes('weight') && !n.includes('lean'))) row.weight_kg = qty;
  else if (n.includes('exercise') && (n.includes('time') || n.includes('minute'))) row.exercise_minutes = Math.round(qty);
  else if (n.includes('walking') || (n.includes('distance') && !n.includes('swim'))) row.distance_km = qty;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  let rows = [];

  // Simple flat format from Apple Shortcuts:
  // { "date": "2024-01-15", "steps": 8432, "resting_hr": 58, ... }
  if (body.date && /^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    rows = [{ date: body.date, updated_at: new Date().toISOString(),
      steps:            body.steps            != null ? Math.round(body.steps)            : undefined,
      resting_hr:       body.resting_hr       != null ? Number(body.resting_hr)           : undefined,
      sleep_hours:      body.sleep_hours      != null ? Number(body.sleep_hours)          : undefined,
      active_calories:  body.active_calories  != null ? Math.round(body.active_calories)  : undefined,
      hrv:              body.hrv              != null ? Number(body.hrv)                  : undefined,
      weight_kg:        body.weight_kg        != null ? Number(body.weight_kg)            : undefined,
      exercise_minutes: body.exercise_minutes != null ? Math.round(body.exercise_minutes) : undefined,
      distance_km:      body.distance_km      != null ? Number(body.distance_km)          : undefined,
    }];

  // Nested format from Health Auto Export:
  // { "data": [ { "name": "Step Count", "data": [...] } ] }
  } else {
    const metrics = body.data || body.metrics || [];
    const byDate = {};
    for (const metric of metrics) {
      const name = metric.name || '';
      for (const entry of (metric.data || [])) {
        const date = (entry.date || '').substring(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
        if (!byDate[date]) byDate[date] = { date, updated_at: new Date().toISOString() };
        const qty = entry.qty ?? entry.Avg ?? null;
        if (qty !== null) mapMetric(name, qty, byDate[date]);
      }
    }
    rows = Object.values(byDate);
  }

  if (!rows.length) return res.json({ ok: true, inserted: 0 });

  const { error } = await supabase
    .from('health_daily')
    .upsert(rows, { onConflict: 'date' });

  if (error) return res.status(500).json({ error: error.message });

  return res.json({ ok: true, inserted: rows.length });
};
