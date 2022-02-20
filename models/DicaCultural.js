const { sequelize, Sequelize } = require('./db');

const DicaCultural = sequelize.define('tb_dicasculturais', {
  categoriaDicaCultural: {
    type: Sequelize.ENUM('Filme', 'Série', 'Livro')
  },
  titulo: {
    type: Sequelize.STRING
  },
  dataLancamento: {
    type: Sequelize.DATEONLY
  },
  sinopse: {
    type: Sequelize.TEXT
  },
  caminhoImagem: {
    type: Sequelize.STRING
  }
}, { freezeTableName: true })

const Filme = sequelize.define('tb_filmes', {
  idDicaCultural: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    references: {
      model: DicaCultural,
      key: 'id'
    }
  },
  direcaoFilme: {
    type: Sequelize.TEXT
  }
},
  { freezeTableName: true })

const Serie = sequelize.define('tb_series', {
  idDicaCultural: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    references: {
      model: DicaCultural,
      key: 'id'
    }
  },
  qtdTemporadas: {
    type: Sequelize.INTEGER
  },
  direcaoSerie: {
    type: Sequelize.TEXT
  }

}, { freezeTableName: true })

const Livro = sequelize.define('tb_livros', {
  idDicaCultural: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    references: {
      model: DicaCultural,
      key: 'id'
    }
  },
  autor: {
    type: Sequelize.STRING
  },
  editora: {
    type: Sequelize.STRING
  }

}, { freezeTableName: true })

DicaCultural.sync();
Filme.sync();
Serie.sync();
Livro.sync();

module.exports = {
  DicaCultural: DicaCultural,
  Filme: Filme,
  Serie: Serie,
  Livro: Livro
}
