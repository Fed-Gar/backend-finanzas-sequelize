function toISODate(d) {
  const pad = n => String(n).padStart(2, '0');
  
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

function startEndOfDay(dateStr) {
  const d = dateStr ? new Date(dateStr + 'T00:00:00Z') : new Date();
  const start = toISODate(d);
  const end = start;

  return { start, end };
}

function startEndOfWeekISO(dateStr) {
  const d = dateStr ? new Date(dateStr + 'T00:00:00Z') : new Date();

  const day = (d.getUTCDay() || 7);
  const startDate = new Date(d);
  
  startDate.setUTCDate(d.getUTCDate() - (day - 1));
  
  const endDate = new Date(startDate);
 
  endDate.setUTCDate(startDate.getUTCDate() + 6);
  
  return { start: toISODate(startDate), end: toISODate(endDate) };
}

function startEndOfMonth(year, month1based) {
  const y = Number(year);
  const m = Number(month1based); // 1..12
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0)); // día 0 del próximo mes => último del mes actual
  
  return { start: toISODate(start), end: toISODate(end) };
}

function startEndOfYear(year) {
  const y = Number(year);
 
  return { start: `${y}-01-01`, end: `${y}-12-31` };
}

module.exports = {
  toISODate,
  startEndOfDay,
  startEndOfWeekISO,
  startEndOfMonth,
  startEndOfYear
};
