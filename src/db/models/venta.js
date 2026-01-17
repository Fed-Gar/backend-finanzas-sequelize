module.exports = (sequelize, DataTypes) => {
  const Venta = sequelize.define('Venta', {
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    categoria: { type: DataTypes.STRING(100), allowNull: false },
    monto: { type: DataTypes.DECIMAL(12,2), allowNull: false },
    descripcion: { type: DataTypes.TEXT }
  }, { tableName: 'ventas', paranoid: true });
  
  return Venta;
};
