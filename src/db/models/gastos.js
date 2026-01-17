module.exports = (sequelize, DataTypes) => {
  const Gasto = sequelize.define('Gasto', {
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    categoria: { type: DataTypes.STRING(100), allowNull: false },
    monto: { type: DataTypes.DECIMAL(12,2), allowNull: false },
    descripcion: { type: DataTypes.TEXT },
    userId: { type: DataTypes.INTEGER }
  }, { tableName: 'gastos', paranoid: true });
  return Gasto;
};
