const { Op } = require('sequelize');

const {
  startEndOfDay,
  startEndOfWeekISO,
  startEndOfMonth,
  startEndOfYear
} = require('./date');

function parseFilters(query) {
  const { periodo, from, to, fecha, anio, mes } = query;
  const where = {};

  // Rango explicito from/to
  if (from && to) {
    return { where: { fecha: { [Op.between]: [from, to] } } };
  }

  // Si viene periodo vacio -> listado completo
  if (!periodo) return { where };

  // Acepto:
  // - 'dia' | 'semana' | 'mes' | 'anio'
  // - numero de mes (1-12 o "01"-"12"), con 'anio' opcional
  const p = String(periodo).toLowerCase();

  const mesNum = /^\d{1,2}$/.test(p) ? Number(p) : null;
  if (mesNum && mesNum >= 1 && mesNum <= 12) {
    const year = anio ? Number(anio) : new Date().getUTCFullYear();
    const { start, end } = startEndOfMonth(year, mesNum);
    return { where: { fecha: { [Op.between]: [start, end] } } };
  }

  // Palabras clave
  const valid = ['dia', 'semana', 'mes', 'anio'];
  if (!valid.includes(p)) {
    const err = new Error("Parametro 'periodo' invalido: use dia|semana|mes|anio o un numero de mes (1..12).");
    err.status = 400;
    throw err;
  }

  if (p === 'dia') {
    const { start, end } = startEndOfDay(fecha);
    where.fecha = { [Op.between]: [start, end] };
  } else if (p === 'semana') {
    const { start, end } = startEndOfWeekISO(fecha);
    where.fecha = { [Op.between]: [start, end] };
  } else if (p === 'mes') {
    const year = anio ? Number(anio) : (fecha ? new Date(fecha + 'T00:00:00Z').getUTCFullYear() : new Date().getUTCFullYear());
    const month = mes ? Number(mes) : (fecha ? (new Date(fecha + 'T00:00:00Z').getUTCMonth() + 1) : (new Date().getUTCMonth() + 1));
    const { start, end } = startEndOfMonth(year, month);
    where.fecha = { [Op.between]: [start, end] };
  } else if (p === 'anio') {
    const year = anio ? Number(anio) : (fecha ? new Date(fecha + 'T00:00:00Z').getUTCFullYear() : new Date().getUTCFullYear());
    const { start, end } = startEndOfYear(year);
    where.fecha = { [Op.between]: [start, end] };
  }

  return { where };
}

module.exports = parseFilters;
