const express = require('express')
const router = express.Router()
const { DicaCultural, Filme, Serie, Livro } = require('../models/DicaCultural')


router.get('/', function (req, res) {
  res.render('dicas-culturais/dicas-culturais')

})

router.get('/livros', async function (req, res) {

  const registrosPorPagina = 4;

  var paginaAtual
  if (!parseInt(req.query.pagina)) {
    paginaAtual = 1;
  }
  else {
    paginaAtual = parseInt(req.query.pagina)
  }

  console.log(paginaAtual)

  var botaoPrimeiraPagina = false
  if ((paginaAtual != 1) && (paginaAtual != 2)) {
    botaoPrimeiraPagina = true
  }
  console.log(botaoPrimeiraPagina)

  const indiceInicial = (paginaAtual - 1) * registrosPorPagina

  var paginaAnterior
  if (indiceInicial > 0) {
    paginaAnterior = paginaAtual - 1
  }
  console.log(paginaAnterior)

  const numeroRegistros = await Livro.count()


  var ultimaPagina
  if (numeroRegistros < registrosPorPagina) {
    ultimaPagina = 1
  }
  else {
    ultimaPagina = Math.ceil(numeroRegistros / registrosPorPagina)
  }
  console.log(ultimaPagina)

  var proximaPagina
  var botaoUltimaPagina
  if (!(ultimaPagina == paginaAtual)) {
    proximaPagina = paginaAtual + 1
    if (!(paginaAtual == (ultimaPagina - 1))) {
      botaoUltimaPagina = true
    }
  }
  console.log(proximaPagina)
  console.log(botaoUltimaPagina)

  DicaCultural.findAll({
    where: {
      categoriaDicaCultural: 'Livro'
    },
    limit: registrosPorPagina,
    offset: indiceInicial,
    raw: true,
    order: [['updatedAt', 'DESC']]

  }).then(async function (tb_livros) {
    for (let index = 0; index < tb_livros.length; index++) {
      const registro = tb_livros[index];
      var livro = await Livro.findByPk(registro.id, { raw: true })

      tb_livros[index].autor = livro.autor
      tb_livros[index].editora = livro.editora
    }
    res.render('dicas-culturais/livros', {
      livros: tb_livros,
      paginaAnterior: paginaAnterior,
      paginaAtual: paginaAtual,
      proximaPagina: proximaPagina,
      ultimaPagina: ultimaPagina,
      botaoPrimeiraPagina: botaoPrimeiraPagina,
      botaoUltimaPagina: botaoUltimaPagina,
      mensagemErro: 'Não há registros no sistema!'

    })
  })

})

router.get('/series', async function (req, res) {
  const registrosPorPagina = 4;

  var paginaAtual
  if (!parseInt(req.query.pagina)) {
    paginaAtual = 1;
  }
  else {
    paginaAtual = parseInt(req.query.pagina)
  }


  var botaoPrimeiraPagina = false
  if ((paginaAtual != 1) && (paginaAtual != 2)) {
    botaoPrimeiraPagina = true
  }

  const indiceInicial = (paginaAtual - 1) * registrosPorPagina

  var paginaAnterior
  if (indiceInicial > 0) {
    paginaAnterior = paginaAtual - 1
  }

  const numeroRegistros = await Serie.count()

  var ultimaPagina
  if (numeroRegistros < registrosPorPagina) {
    ultimaPagina = 1
  }
  else {
    ultimaPagina = Math.ceil(numeroRegistros / registrosPorPagina)
  }

  var proximaPagina
  var botaoUltimaPagina
  if (!(ultimaPagina == paginaAtual)) {
    proximaPagina = paginaAtual + 1
    if (!(paginaAtual == (ultimaPagina - 1))) {
      botaoUltimaPagina = true
    }
  }
  DicaCultural.findAll({
    where: {
      categoriaDicaCultural: 'Serie'
    },
    raw: true,
    limit: registrosPorPagina,
    offset: indiceInicial,
    order: [['updatedAt', 'DESC']]

  }).then(async function (tb_series) {
    for (let index = 0; index < tb_series.length; index++) {
      const registro = tb_series[index];
      var serie = await Serie.findByPk(registro.id, { raw: true })

      tb_series[index].qtdTemporadas = serie.qtdTemporadas
      tb_series[index].direcaoSerie = serie.direcaoSerie
    }
    res.render('dicas-culturais/series', {
      series: tb_series,
      paginaAnterior: paginaAnterior,
      paginaAtual: paginaAtual,
      proximaPagina: proximaPagina,
      ultimaPagina: ultimaPagina,
      botaoPrimeiraPagina: botaoPrimeiraPagina,
      botaoUltimaPagina: botaoUltimaPagina,
      mensagemErro: 'Não há registros no sistema!'

    })
  })
})

router.get('/filmes', async function (req, res) {
  const registrosPorPagina = 4;

  var paginaAtual
  if (!parseInt(req.query.pagina)) {
    paginaAtual = 1;
  }
  else {
    paginaAtual = parseInt(req.query.pagina)
  }

  var botaoPrimeiraPagina = false
  if ((paginaAtual != 1) && (paginaAtual != 2)) {
    botaoPrimeiraPagina = true
  }

  const indiceInicial = (paginaAtual - 1) * registrosPorPagina

  var paginaAnterior
  if (indiceInicial > 0) {
    paginaAnterior = paginaAtual - 1
  }

  const numeroRegistros = await Filme.count()


  var ultimaPagina
  if (numeroRegistros < registrosPorPagina) {
    ultimaPagina = 1
  }
  else {
    ultimaPagina = Math.ceil(numeroRegistros / registrosPorPagina)
  }

  var proximaPagina
  var botaoUltimaPagina
  if (!(ultimaPagina == paginaAtual)) {
    proximaPagina = paginaAtual + 1
    if (!(paginaAtual == (ultimaPagina - 1))) {
      botaoUltimaPagina = true
    }
  }
  DicaCultural.findAll({
    where: {
      categoriaDicaCultural: 'Filme'
    },
    raw: true,
    limit: registrosPorPagina,
    offset: indiceInicial,
    order: [['updatedAt', 'DESC']]
  }).then(async function (tb_filmes) {
    for (let index = 0; index < tb_filmes.length; index++) {
      const registro = tb_filmes[index];
      var filme = await Filme.findByPk(registro.id, { raw: true })

      tb_filmes[index].direcaoFilme = filme.direcaoFilme
    }

    res.render('dicas-culturais/filmes', {
      filmes: tb_filmes,
      paginaAnterior: paginaAnterior,
      paginaAtual: paginaAtual,
      proximaPagina: proximaPagina,
      ultimaPagina: ultimaPagina,
      botaoPrimeiraPagina: botaoPrimeiraPagina,
      botaoUltimaPagina: botaoUltimaPagina,
      mensagemErro: 'Não há registros no sistema!'

    })
  })
})



module.exports = router