require('dotenv').config();
const express = require('express');
const routes = require('./routes');
const errorHandler = require('../middlewares/error');
const { sequelize } = require('../db/models');

const app = express();
app.use(express.json());
app.use(routes);
app.use(errorHandler);

const port = Number(process.env.PORT) || 3001;
app.listen(port, async () => {
  try {
    await sequelize.authenticate();
    console.log('FINANZAS listening on', port);
  } catch (e) {
    console.error('DB error:', e);
  }
});
