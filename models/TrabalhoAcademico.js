const { sequelize, Sequelize } = require('./db');

const TrabalhoAcademico = sequelize.define('tb_trabalhos', {
  autor: {
    type: Sequelize.STRING
  },
  categoriaTrabalho: {
    type: Sequelize.STRING,
    allowNull: false
  },
  dataPublicacao: {
    type: Sequelize.DATEONLY
  },
  instituicao: {
    type: Sequelize.STRING
  },
  tituloTrabalho: {
    type: Sequelize.STRING
  },
  linkTrabalho: {
    type: Sequelize.STRING,
    set(value) {
      if ((value.substring(0, 7) == 'http://') || (value.substring(0, 8) == 'https://')) {
        this.setDataValue('linkTrabalho', value)
      }
      else {
        this.setDataValue('linkTrabalho', 'http://' + value)
      }
    }
  }
}, { freezeTableName: true })

TrabalhoAcademico.sync()

module.exports = TrabalhoAcademico;