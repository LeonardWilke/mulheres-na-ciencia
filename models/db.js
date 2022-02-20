const Sequelize = require('sequelize');
const sequelize = new Sequelize('db_mulheresnaciencia', 'root', 'root', {
  host: "localhost",
  dialect: 'mysql'
});

module.exports = { sequelize: sequelize, Sequelize: Sequelize }
