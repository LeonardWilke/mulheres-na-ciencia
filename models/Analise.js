const { sequelize, Sequelize } = require('./db');

const Analise = sequelize.define('tb_analises', {
  tituloAnalise: {
    type: Sequelize.STRING,
    allowNull: false
  },
  caminhoImagemCapa: {
    type: Sequelize.STRING
  },
  caminhoTexto: {
    type: Sequelize.STRING
  }
}, { freezeTableName: true })

Analise.sync()

module.exports = Analise;