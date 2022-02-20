const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const multer = require('multer')
const bcrypt = require('bcryptjs')
const upload = multer({ dest: './temp/' })
const { eCoordenador } = require('../helpers/eCoordenador')

//Modelos
const { Op } = require('sequelize')
const TrabalhoAcademico = require('../models/TrabalhoAcademico')
const { DicaCultural, Filme, Serie, Livro } = require('../models/DicaCultural')
const Integrante = require('../models/Integrante')
const Analise = require('../models/Analise')

// TODO: Precisa passar um objeto com o cargo e o atributo é administrador ou não
const TabelasAceitas = {
  teses: {
    caminhoGerenciar: 'area-privada/gerenciar-teses/gerenciar-teses',
    modelo: TrabalhoAcademico,
    caminhoCriar: 'area-privada/gerenciar-teses/edicao-teses/editar-trabalhos'
  },
  integrantes: {
    caminhoGerenciar: 'area-privada/gerenciar-integrantes/gerenciar-integrantes',
    modelo: Integrante,
    caminhoCriar: 'area-privada/gerenciar-integrantes/edicao-integrantes/editar-integrantes'
  },
  analises: {
    caminhoGerenciar: 'area-privada/gerenciar-analises/gerenciar-analises',
    modelo: Analise,
    caminhoCriar: 'area-privada/gerenciar-analises/edicao-analises/editar-analises'
  }
}

const TabelasAceitasDicasCulturais = {
  filmes: {
    caminhoGerenciar: 'area-privada/gerenciar-dicas-culturais/gerenciar-filmes',
    modelo: Filme,
    caminhoCriar: 'area-privada/gerenciar-dicas-culturais/edicao-dicas-culturais/editar-filmes'
  },
  series: {
    caminhoGerenciar: 'area-privada/gerenciar-dicas-culturais/gerenciar-series',
    modelo: Serie,
    caminhoCriar: 'area-privada/gerenciar-dicas-culturais/edicao-dicas-culturais/editar-series'
  },
  livros: {
    caminhoGerenciar: 'area-privada/gerenciar-dicas-culturais/gerenciar-livros',
    modelo: Livro,
    caminhoCriar: 'area-privada/gerenciar-dicas-culturais/edicao-dicas-culturais/editar-livros'
  }
}

router.get('/', function (req, res) {
  const eCoordenador = (req.user.cargoIntegrante == 'Coordenador')
  res.render('area-privada/pagina-inicial-area-restrita', { layout: 'area-restrita', eCoordenador: eCoordenador })
})

router.get('/editar-perfil', function (req, res) {
  res.render('area-privada/editar-dados-integrante', { layout: 'area-restrita', usuario: req.user })
})

router.post('/editar-perfil', async function (req, res) {
  var retornar = false
  if (req.body.senhaAtual && req.body.novaSenha && req.body.confirmarNovaSenha) {
    const senhasBatem = await bcrypt.compare(req.body.senhaAtual, req.user.senhaLogin)
    const verificacaoSenha = (req.body.novaSenha == req.body.confirmarNovaSenha)
    if (senhasBatem && verificacaoSenha) {
      bcrypt.genSalt(10, function (erro, salt) {
        bcrypt.hash(req.body.novaSenha, salt, async function (erro, hash) {
          await Integrante.update({ senhaLogin: hash }, { where: { id: req.user.id } })
        })
      })
    }
    else {
      if (!senhasBatem) {
        req.flash('error_msg', 'Senha atual incorreta! Tente novamente.')
      }
      else {
        req.flash('error_msg', 'Os dois campos de "Nova Senha" não são iguais! Tente novamente.')
      }
      res.redirect('/restrito/editar-perfil')
      retornar = true
    }
  }
  if (!retornar) {
    Integrante.update({
      nome: req.body.nome,
      cpfIntegrante: req.body.cpfIntegrante,
      telefone: req.body.telefone,
      email: req.body.email,
      rgIntegrante: req.body.rgIntegrante
    }, {
      where: {
        id: req.user.id
      }
    }).then(function () {
      req.flash('success_msg', 'Dados atualizados com sucesso!')
      res.redirect('/restrito')
    })
  }
})

router.get('/logout', function (req, res) {
  req.logout()
  res.redirect('/')
})

router.get('/gerenciar/dicas-culturais', function (req, res) {
  res.render('area-privada/gerenciar-dicas-culturais/gerenciar-dicas-culturais', { layout: 'area-restrita' })
})

router.get('/gerenciar/dicas-culturais/:tabelacultural', async function (req, res) {
  var modelo = TabelasAceitasDicasCulturais[req.params.tabelacultural].modelo
  var caminho = TabelasAceitasDicasCulturais[req.params.tabelacultural].caminhoGerenciar

  const registrosPorPagina = 8;

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

  const numeroRegistros = await modelo.count()


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

  modelo.findAll({
    limit: registrosPorPagina,
    offset: indiceInicial,
    raw: true,
    order: [['updatedAt', 'DESC']]
  }).then(async function (dados) {
    for (let index = 0; index < dados.length; index++) {
      const registro = dados[index];
      var dicaCultural = await DicaCultural.findByPk(registro.idDicaCultural, { raw: true })

      dados[index].titulo = dicaCultural.titulo
      dados[index].dataLancamento = dicaCultural.dataLancamento
      dados[index].sinopse = dicaCultural.sinopse
      dados[index].caminhoImagem = dicaCultural.caminhoImagem
    }
    console.log(dados[0])
    res.render(caminho, {
      layout: 'area-restrita',
      nomeTabela: req.params.tabelacultural,
      dados: dados,
      paginaAnterior: paginaAnterior,
      paginaAtual: paginaAtual,
      proximaPagina: proximaPagina,
      ultimaPagina: ultimaPagina,
      botaoPrimeiraPagina: botaoPrimeiraPagina,
      botaoUltimaPagina: botaoUltimaPagina,
      mensagemErro: 'Não há registros no sistema!'
    })
  }).catch(function (erro) {
    res.render(caminho, {
      layout: 'area-restrita',
      nomeTabela: req.params.tabela,
      paginaAnterior: paginaAnterior,
      paginaAtual: paginaAtual,
      proximaPagina: proximaPagina,
      ultimaPagina: ultimaPagina,
      botaoPrimeiraPagina: botaoPrimeiraPagina,
      botaoUltimaPagina: botaoUltimaPagina,
      mensagemErro: 'Ocorreu um erro ao carregar os registros. Tente novamente.'
    })
  })
})

router.get('/gerenciar/integrantes', eCoordenador, async function (req, res) {
  var modelo = TabelasAceitas['integrantes'].modelo
  var caminho = TabelasAceitas['integrantes'].caminhoGerenciar

  const registrosPorPagina = 8;

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

  const numeroRegistros = await modelo.count()


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

  modelo.findAll({
    limit: registrosPorPagina,
    offset: indiceInicial,
    raw: true,
    order: [['updatedAt', 'DESC']]
  }).then(function (dados) {
    res.render(caminho, {
      layout: 'area-restrita',
      nomeTabela: 'integrantes',
      dados: dados,
      paginaAnterior: paginaAnterior,
      paginaAtual: paginaAtual,
      proximaPagina: proximaPagina,
      ultimaPagina: ultimaPagina,
      botaoPrimeiraPagina: botaoPrimeiraPagina,
      botaoUltimaPagina: botaoUltimaPagina,
      mensagemErro: 'Não há registros no sistema!'
    })
  }).catch(function (erro) {
    res.render(caminho, {
      layout: 'area-restrita',
      nomeTabela: 'integrantes',
      paginaAnterior: paginaAnterior,
      paginaAtual: paginaAtual,
      proximaPagina: proximaPagina,
      ultimaPagina: ultimaPagina,
      botaoPrimeiraPagina: botaoPrimeiraPagina,
      botaoUltimaPagina: botaoUltimaPagina,
      mensagemErro: 'Ocorreu um erro ao carregar os registros. Tente novamente.'
    })
  })

})

router.get('/gerenciar/:tabela', async function (req, res) {
  var search
  var objetoWhere
  if (req.query.search) {
    search = req.query.search
    objetoWhere = {
      tituloTrabalho: {
        [Op.substring]: search
      }
    }
  }
  else {
    search = ""
    objetoWhere = null
  }

  var modelo = TabelasAceitas[req.params.tabela].modelo
  var caminho = TabelasAceitas[req.params.tabela].caminhoGerenciar

  const registrosPorPagina = 8;

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

  const numeroRegistros = await modelo.count({
    where: objetoWhere
  })


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

  modelo.findAll({
    where: objetoWhere,
    limit: registrosPorPagina,
    offset: indiceInicial,
    raw: true,
    order: [['updatedAt', 'DESC']]
  }).then(function (dados) {
    res.render(caminho, {
      layout: 'area-restrita',
      nomeTabela: req.params.tabela,
      dados: dados,
      paginaAnterior: paginaAnterior,
      paginaAtual: paginaAtual,
      proximaPagina: proximaPagina,
      ultimaPagina: ultimaPagina,
      botaoPrimeiraPagina: botaoPrimeiraPagina,
      botaoUltimaPagina: botaoUltimaPagina,
      mensagemErro: 'Não há registros no sistema!'
    })
  }).catch(function (erro) {
    res.render(caminho, {
      layout: 'area-restrita',
      nomeTabela: req.params.tabela,
      paginaAnterior: paginaAnterior,
      paginaAtual: paginaAtual,
      proximaPagina: proximaPagina,
      ultimaPagina: ultimaPagina,
      botaoPrimeiraPagina: botaoPrimeiraPagina,
      botaoUltimaPagina: botaoUltimaPagina,
      mensagemErro: 'Ocorreu um erro ao carregar os registros. Tente novamente.'
    })
  })


})

router.get('/criar/dicas-culturais/:tabelacultural', function (req, res) {
  var caminho = TabelasAceitasDicasCulturais[req.params.tabelacultural].caminhoCriar

  res.render(caminho, { layout: 'area-restrita' })
})

router.get('/criar/integrantes', eCoordenador, function (req, res) {
  var caminho = TabelasAceitas['integrantes'].caminhoCriar

  res.render(caminho, { layout: 'area-restrita' })
})

router.get('/criar/:tabela', function (req, res) {
  var caminho = TabelasAceitas[req.params.tabela].caminhoCriar

  res.render(caminho, { layout: 'area-restrita' })
})

router.post('/registrar/analise', upload.single('imagemCapa'), async function (req, res) {
  var analise = await Analise.create({
    tituloAnalise: req.body.tituloAnalise
  })

  // Lidando com a Imagem de Capa
  var imagem = req.file
  var tipo = imagem.mimetype
  tipo = tipo.substring(6)
  var nomeNovoArquivo = analise.id + '.' + tipo
  var caminhoAntigo = path.join(__dirname, '..', 'temp', imagem.filename)
  var caminhoNovo = path.join(__dirname, '..', 'assets', 'imagens', 'analises', 'capas', nomeNovoArquivo)
  fs.renameSync(caminhoAntigo, caminhoNovo)

  analise.caminhoImagemCapa = '/imagens/analises/capas/' + nomeNovoArquivo

  //Lidando com o Texto

  var caminhoTextoAnalise = path.join(__dirname, '..', 'views', 'partials', 'analises', analise.id.toString() + '.handlebars')
  await fs.writeFile(caminhoTextoAnalise, req.body.texto, function (err) {
    if (err) {
      req.flash('error_msg', 'Erro ao cadastrar nova análise: ' + err)
      res.redirect('/restrito/gerenciar/analises')
    }
  })

  caminhoTextoAnalise = 'analises/' + analise.id
  analise.caminhoTexto = caminhoTextoAnalise
  analise.save()

  req.flash('success_msg', 'Análise cadastrada com sucesso!')
  res.redirect('/restrito/gerenciar/analises')
})

router.post('/update/analise/:id', upload.single('imagemCapa'), async function (req, res) {
  await Analise.update({
    tituloAnalise: req.body.tituloAnalise
  }, {
    where: {
      id: parseInt(req.params.id)
    }
  })

  //Lidando com o Texto

  var caminhoTextoAnalise = path.join(__dirname, '..', 'views', 'partials', 'analises', req.params.id + '.handlebars')
  await fs.writeFile(caminhoTextoAnalise, req.body.texto, function (err) {
    if (err) {
      req.flash('error_msg', 'Erro ao cadastrar nova análise: ' + err)
      res.redirect('/restrito/gerenciar/analises')
    }
  })

  caminhoTextoAnalise = 'analises/' + req.params.id

  // Lidando com a Imagem
  var imagem = req.file
  if (imagem) {
    var tipo = imagem.mimetype
    tipo = tipo.substring(6)
    var nomeNovoArquivo = req.params.id + '.' + tipo
    var caminhoAntigo = path.join(__dirname, '..', 'temp', imagem.filename)
    var caminhoNovo = path.join(__dirname, '..', 'assets', 'imagens', 'analises', 'capas', nomeNovoArquivo)
    fs.renameSync(caminhoAntigo, caminhoNovo)

    var caminhoImagem = '/imagens/analises/capas/' + nomeNovoArquivo
    await Analise.update({
      caminhoImagemCapa: caminhoImagem,
      caminhoTexto: caminhoTextoAnalise
    }, {
      where: {
        id: parseInt(req.params.id)
      }
    })
  }
  else {
    await Analise.update({
      caminhoTexto: caminhoTextoAnalise
    }, {
      where: {
        id: parseInt(req.params.id)
      }
    })
  }

  req.flash('Análise atualizada com sucesso')
  res.redirect('/restrito/gerenciar/analises')

})

router.post('/registrar/dica-cultural', upload.single('imagem'), async function (req, res) {
  var instancia = await DicaCultural.create({
    titulo: req.body.titulo,
    categoriaDicaCultural: req.body.categoriaDicaCultural,
    dataLancamento: req.body.dataLancamento,
    sinopse: req.body.sinopse
  })

  // Lidando com a imagem
  var imagem = req.file
  var tipo = imagem.mimetype
  tipo = tipo.substring(6)
  var nomeNovoArquivo = instancia.id + '.' + tipo
  var caminhoAntigo = path.join(__dirname, '..', 'temp', imagem.filename)
  var caminhoNovo = path.join(__dirname, '..', 'assets', 'imagens', 'dicas-culturais', 'registros', nomeNovoArquivo)
  fs.renameSync(caminhoAntigo, caminhoNovo)

  instancia.caminhoImagem = '/imagens/dicas-culturais/registros/' + nomeNovoArquivo
  instancia.save()

  //Filmes
  if (instancia.categoriaDicaCultural == 'Filme') {
    await Filme.create({
      idDicaCultural: instancia.id,
      direcaoFilme: req.body.direcaoFilme
    })
    req.flash('success_msg', 'Filme cadastrado com sucesso!')
    res.redirect('/restrito/gerenciar/dicas-culturais/filmes')
  }
  //Séries
  else if (instancia.categoriaDicaCultural == 'Série') {
    await Serie.create({
      idDicaCultural: instancia.id,
      qtdTemporadas: req.body.qtdTemporadas,
      direcaoSerie: req.body.direcaoSerie
    })
    req.flash('success_msg', 'Série cadastrada com sucesso!')
    res.redirect('/restrito/gerenciar/dicas-culturais/series')
  }
  //Livros
  else {
    await Livro.create({
      idDicaCultural: instancia.id,
      autor: req.body.autor,
      editora: req.body.editora
    })
    req.flash('success_msg', 'Livro cadastrado com sucesso!')
    res.redirect('/restrito/gerenciar/dicas-culturais/livros')
  }

})

router.post('/update/dica-cultural/:id', upload.single('imagem'), async function (req, res) {
  await DicaCultural.update({
    titulo: req.body.titulo,
    categoriaDicaCultural: req.body.categoriaDicaCultural,
    dataLancamento: req.body.dataLancamento,
    sinopse: req.body.sinopse
  }, {
    where: {
      id: parseInt(req.params.id)
    }
  })

  var instancia = await DicaCultural.findByPk(parseInt(req.params.id), { raw: true })

  // Lidando com a imagem
  var imagem = req.file
  if (imagem) {
    var tipo = imagem.mimetype
    tipo = tipo.substring(6)
    var nomeNovoArquivo = instancia.id + '.' + tipo
    var caminhoAntigo = path.join(__dirname, '..', 'temp', imagem.filename)
    var caminhoNovo = path.join(__dirname, '..', 'assets', 'imagens', 'dicas-culturais', 'registros', nomeNovoArquivo)
    fs.renameSync(caminhoAntigo, caminhoNovo)

    var caminhoImagem = '/imagens/dicas-culturais/registros/' + nomeNovoArquivo
    await DicaCultural.update({
      caminhoImagem: caminhoImagem
    }, {
      where: {
        id: parseInt(req.params.id)
      }
    })
  }

  //Filmes
  if (instancia.categoriaDicaCultural == 'Filme') {
    await Filme.update({
      direcaoFilme: req.body.direcaoFilme
    }, {
      where: {
        idDicaCultural: instancia.id
      }
    })
    req.flash('success_msg', 'Filme atualizado com sucesso!')
    res.redirect('/restrito/gerenciar/dicas-culturais/filmes')
  }
  //Séries
  else if (instancia.categoriaDicaCultural == 'Série') {
    await Serie.update({
      qtdTemporadas: req.body.qtdTemporadas,
      direcaoSerie: req.body.direcaoSerie
    }, {
      where: {
        idDicaCultural: instancia.id
      }
    })
    req.flash('success_msg', 'Série atualizada com sucesso!')
    res.redirect('/restrito/gerenciar/dicas-culturais/series')
  }
  //Livros
  else {
    await Livro.update({
      autor: req.body.autor,
      editora: req.body.editora
    }, {
      where: {
        idDicaCultural: instancia.id
      }
    })
    req.flash('success_msg', 'Livro atualizado com sucesso!')
    res.redirect('/restrito/gerenciar/dicas-culturais/livros')
  }

})

router.post('/registrar/integrante', eCoordenador, async function (req, res) {
  const senha = 'mulheresnaciencia123'

  var integrante = await Integrante.create({
    nome: req.body.nome,
    cpfIntegrante: req.body.cpfIntegrante,
    rgIntegrante: req.body.rgIntegrante,
    cargoIntegrante: req.body.cargoIntegrante,
    telefone: req.body.telefone,
    email: req.body.email
  })

  bcrypt.genSalt(10, function (erro, salt) {
    bcrypt.hash(senha, salt, function (erro, hash) {
      integrante.senhaLogin = hash
      integrante.save().then(function () {
        req.flash('success_msg', 'Integrante cadastrada com sucesso!')
        res.redirect('/restrito/gerenciar/integrantes')
      }).catch(function (erro) {
        req.flash('error_msg', 'Erro ao cadastrar tese' + erro)
        res.redirect('/restrito/gerenciar/integrantes')
      })
    })
  })
})

router.post('/update/integrante/:id', eCoordenador, function (req, res) {
  if (req.body.senha) {
    bcrypt.genSalt(10, function (erro, salt) {
      bcrypt.hash(req.body.senha, salt, async function (erro, hash) {
        await Integrante.update({
          senhaLogin: hash
        }, {
          where: {
            id: parseInt(req.params.id)
          }
        })
      })
    })

  }

  Integrante.update({
    nome: req.body.nome,
    cpfIntegrante: req.body.cpfIntegrante,
    rgIntegrante: req.body.rgIntegrante,
    cargoIntegrante: req.body.cargoIntegrante,
    telefone: req.body.telefone,
    email: req.body.email
  }, {
    where: {
      id: parseInt(req.params.id)
    }
  }).then(function () {
    req.flash('success_msg', 'Integrante editada com sucesso!')
    res.redirect('/restrito/gerenciar/integrantes')
  }).catch(function () {
    req.flash('error_msg', 'Erro ao editar integrante' + erro)
    res.redirect('/restrito/gerenciar/integrantes')
  })
})

router.post("/registrar/trabalho-academico", function (req, res) {
  TrabalhoAcademico.create({
    dataPublicacao: req.body.dataPublicacao,
    autor: req.body.autor,
    tituloTrabalho: req.body.tituloTrabalho,
    categoriaTrabalho: req.body.categoriaTrabalho,
    linkTrabalho: req.body.linkTrabalho,
    instituicao: req.body.instituicao
  }).then(function () {
    req.flash('success_msg', 'Tese cadastrada com sucesso!')
    res.redirect('/restrito/gerenciar/teses')
  }).catch(function (erro) {
    req.flash('error_msg', 'Erro ao cadastrar tese' + erro)
    res.redirect('/restrito/gerenciar/teses')
  })
})

router.post('/update/trabalho-academico/:id', function (req, res) {
  TrabalhoAcademico.update({
    dataPublicacao: req.body.dataPublicacao,
    autor: req.body.autor,
    tituloTrabalho: req.body.tituloTrabalho,
    categoriaTrabalho: req.body.categoriaTrabalho,
    linkTrabalho: req.body.linkTrabalho,
    instituicao: req.body.instituicao
  }, {
    where: {
      id: parseInt(req.params.id)
    }
  }).then(function () {
    req.flash('success_msg', 'Tese editada com sucesso!')
    res.redirect('/restrito/gerenciar/teses')
  }).catch(function () {
    req.flash('error_msg', 'Erro ao editar tese' + erro)
    res.redirect('/restrito/gerenciar/teses')
  })

})

router.post('/deletar/integrantes/:id', eCoordenador, function (req, res) {
  var modelo = TabelasAceitas['integrantes'].modelo
  modelo.destroy({
    where: { id: req.params.id }
  }).then(function () {
    req.flash('success_msg', 'Registro deletado com sucesso!')
    res.redirect('/restrito/gerenciar/' + req.params.tabela)
  }).catch(function (erro) {
    req.flash('error_msg', 'Ocorreu um erro ao deletar o registro. Tente novamente.')
    res.redirect('/restrito/gerenciar/integrantes')
  })
})

router.post("/deletar/:tabela/:id", function (req, res) {
  var modelo = TabelasAceitas[req.params.tabela].modelo
  modelo.destroy({
    where: { id: req.params.id }
  }).then(function () {
    req.flash('success_msg', 'Registro deletado com sucesso!')
    res.redirect('/restrito/gerenciar/' + req.params.tabela)
  }).catch(function (erro) {
    req.flash('error_msg', 'Ocorreu um erro ao deletar o registro. Tente novamente.')
    res.redirect('/restrito/gerenciar/' + req.params.tabela)
  })
})

router.post('/deletar/dicas-culturais/:tabelacultural/:id', async function (req, res) {
  var modelo = TabelasAceitasDicasCulturais[req.params.tabelacultural].modelo
  await modelo.destroy({
    where: { idDicaCultural: req.params.id }
  })

  DicaCultural.destroy({
    where: { id: req.params.id }
  }).then(function () {
    req.flash('success_msg', 'Registro deletado com sucesso!')
    res.redirect('/restrito/gerenciar/dicas-culturais/' + req.params.tabelacultural)
  }).catch(function (err) {
    req.flash('error_msg', 'Ocorreu um erro ao deletar o registro. Tente novamente.')
    res.redirect('/restrito/gerenciar/dicas-culturais/' + req.params.tabelacultural)
  })
})

router.get('/editar/dicas-culturais/:tabelacultural/:id', async function (req, res) {
  var modelo = TabelasAceitasDicasCulturais[req.params.tabelacultural].modelo
  var caminho = TabelasAceitasDicasCulturais[req.params.tabelacultural].caminhoCriar
  var id = parseInt(req.params.id)

  var objetoAEditar = await modelo.findByPk(id, { raw: true })
  var dicaCultural = await DicaCultural.findByPk(id, { raw: true })

  objetoAEditar.titulo = dicaCultural.titulo
  objetoAEditar.dataLancamento = dicaCultural.dataLancamento
  objetoAEditar.sinopse = dicaCultural.sinopse
  objetoAEditar.caminhoImagem = dicaCultural.caminhoImagem

  console.log(objetoAEditar)

  res.render(caminho, { layout: 'area-restrita', objetoAEditar: objetoAEditar })
})

router.get('/editar/integrantes/:id', eCoordenador, async function (req, res) {
  var modelo = TabelasAceitas['integrantes'].modelo
  var caminho = TabelasAceitas['integrantes'].caminhoCriar
  var id = parseInt(req.params.id)
  var objetoAEditar = await modelo.findByPk(id, { raw: true })

  res.render(caminho, { layout: 'area-restrita', objetoAEditar: objetoAEditar })
})

router.get('/editar/:tabela/:id', async function (req, res) {
  var modelo = TabelasAceitas[req.params.tabela].modelo
  var caminho = TabelasAceitas[req.params.tabela].caminhoCriar
  var id = parseInt(req.params.id)
  var objetoAEditar = await modelo.findByPk(id, { raw: true })

  res.render(caminho, { layout: 'area-restrita', objetoAEditar: objetoAEditar })
})



module.exports = router