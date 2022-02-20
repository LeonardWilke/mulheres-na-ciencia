const { sequelize, Sequelize } = require('./db');

const Integrante = sequelize.define('tb_integrantes', {
  cpfIntegrante: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  cargoIntegrante: {
    type: Sequelize.ENUM('Voluntário', 'Bolsista', 'Coordenador'),
    allowNull: false
  },
  nome: {
    type: Sequelize.STRING,
    allowNull: true
  },
  telefone: {
    type: Sequelize.STRING,
    allowNull: false
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  rgIntegrante: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },

  senhaLogin: {
    type: Sequelize.TEXT
  }
}, { freezeTableName: true })

Integrante.sync();
module.exports = Integrante