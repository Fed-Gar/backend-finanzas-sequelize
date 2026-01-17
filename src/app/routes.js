const { Router } = require('express');
const { Op, fn, col, literal } = require('sequelize');
const { Venta, Gasto, sequelize } = require('../db/models');
const auth = require('../middlewares/auth');

const {
  startEndOfDay,
  startEndOfWeekISO,
  startEndOfMonth,
  startEndOfYear
} = require('../utils/date');

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true, service: 'finanzas' }));

function parseFilters(query) {
  const { periodo, from, to, fecha, anio, mes } = query;
  const where = {};

  // Rango explícito from/to   
  if (from && to) {
    return { where: { fecha: { [Op.between]: [from, to] } } };
  }

  // Si viene periodo vacío -> listado completo
  if (!periodo) return { where };

  // Acepto:
  // - 'dia' | 'semana' | 'mes' | 'anio'
  // - número de mes (1-12 o "01"-"12"), con 'anio' opcional
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
    const err = new Error(`Parametro 'periodo' inválido: use dia|semana|mes|anio o un número de mes (1..12).`);
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

function crud(entity, Model) {
  router.post(`/${entity}`, auth, async (req, res, next) => {
    try {
      const body = { ...req.body, userId: req.user?.id };
      const r = await Model.create(body);
     
      res.status(201).json(r);
    } catch (e) { next(e); }
  });

  router.get(`/${entity}`, auth, async (req, res, next) => {
    try {
      const r = await Model.findAll(parseFilters(req.query));
      
      res.json(r);
    } catch (e) { next(e); }
  });

  router.put(`/${entity}/:id`, auth, async (req, res, next) => {
    try {
      const [n, rows] = await Model.update(req.body, { where: { id: req.params.id }, returning: true });
      
      if (!n) return res.status(404).json({ error: 'Not found' });
     
      res.json(rows[0]);
    } catch (e) { next(e); }
  });

  router.delete(`/${entity}/:id`, auth, async (req, res, next) => {
    try {
      const row = await Model.findByPk(req.params.id);

      if (!row) return res.status(404).json({ error: 'Not found' });

      await row.destroy();

      const msg = entity === 'ventas' ? 'venta eliminada' : entity === 'gastos' ? 'gasto eliminado' : 'eliminado';

      return res.status(200).json({
        message: msg,
      });
    } catch (e) { next(e); }
  });
}

crud('ventas', Venta);
crud('gastos', Gasto);

router.get('/dashboard/line-chart', auth, async (req, res, next) => {
  try {
    const unit = req.query.unit === 'month' ? 'month' : 'day';
    
    const ventas = await Venta.findAll({
      attributes: [[fn('date_trunc', unit, col('fecha')), 'periodo'], [fn('sum', col('monto')), 'total']],
      group: [literal('periodo')], order: [literal('periodo')]
    });
    
    const gastos = await Gasto.findAll({
      attributes: [[fn('date_trunc', unit, col('fecha')), 'periodo'], [fn('sum', col('monto')), 'total']],
      group: [literal('periodo')], order: [literal('periodo')]
    });
    
    res.json({ ventas, gastos });
  } catch (e) { next(e); }
});

router.post('/import-json', auth, async (req, res, next) => {
  try {
    const { ventas = [], gastos = [] } = req.body || {};
    const v = ventas.map(x => ({ ...x, userId: req.user?.id }));
    const g = gastos.map(x => ({ ...x, userId: req.user?.id }));
    
    await sequelize.transaction(async t => {
      if (v.length) await Venta.bulkCreate(v, { transaction: t });
      if (g.length) await Gasto.bulkCreate(g, { transaction: t });
    });
   
    res.status(201).json({ importedVentas: v.length, importedGastos: g.length });
  } catch (e) { next(e); }
});

module.exports = router;
