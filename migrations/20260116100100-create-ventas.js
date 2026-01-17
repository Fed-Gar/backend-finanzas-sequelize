'use strict';

module.exports = {
  async up(q, S) {
    await q.createTable('ventas', {
      id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
      fecha: { type: S.DATEONLY, allowNull: false },
      categoria: { type: S.STRING(100), allowNull: false },
      monto: { type: S.DECIMAL(12,2), allowNull: false },
      descripcion: { type: S.TEXT },
      userId: { type: S.INTEGER },
      createdAt: { type: S.DATE, allowNull: false, defaultValue: S.fn('NOW') },
      updatedAt: { type: S.DATE, allowNull: false, defaultValue: S.fn('NOW') },
      deletedAt: { type: S.DATE }
    });
  },
  async down(q) { await q.dropTable('ventas'); }
};
