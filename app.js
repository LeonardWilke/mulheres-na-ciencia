// Carregando módulos
const express = require('express')
const app = express()
const { create } = require('express-handlebars');
const path = require('path')
const dicasCulturais = require('./rotas/dicas-culturais')
const areaRestrita = require('./rotas/area-restrita')
const bodyParser = require('body-parser')
const session = require('express-session')
const flash = require('connect-flash');
const passport = require('passport')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const bcrypt = require('bcryptjs')
require('./config/auth')(passport)
const { estaAutenticado } = require('./helpers/estaAutenticado')

// Modelos
const { Op } = require('sequelize')
const TrabalhoAcademico = require('./models/TrabalhoAcademico');
const Analise = require('./models/Analise')
const Integrante = require('./models/Integrante')

// Este Secret é somente utilizado neste repositório do GitHub.
// Na aplicação real, há Secrets verdadeiros substituindo este.
const SECRET_TEMPORARIO = 'temporario';

// Configurações
// Sessão
app.use(session({
  secret: SECRET_TEMPORARIO,
  resave: true,
  saveUninitialized: true
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

// Variáveis Globais
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg')
  res.locals.error_msg = req.flash('error_msg')
  res.locals.error = req.flash('error')
  res.locals.user = req.user || null;
  next()
})
// Handlebars
const hbs = create({
  helpers: {
    formatarData(dataDesformatada) {
      var ano = dataDesformatada.substring(0, 4)
      var mes = dataDesformatada.substring(5, 7)
      var dia = dataDesformatada.substring(8, 10)
      var dataFormatada = dia + '/' + mes + '/' + ano
      return dataFormatada
    }
  }
})
app.engine('handlebars', hbs.engine)
app.set('view engine', 'handlebars')
app.set('views', './views')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(express.static(path.join(__dirname, 'assets')))

// Rotas
app.get('/', function (req, res) {
  res.render('pagina-inicial')
})

app.get('/analises', async function (req, res) {
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

  const numeroRegistros = await TrabalhoAcademico.count()


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

  Analise.findAll({
    limit: registrosPorPagina,
    offset: indiceInicial,
    raw: true,
    order: [['updatedAt', 'DESC']]
  }).then(function (tb_analises) {
    res.render('analises', {
      analises: tb_analises,
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

app.get('/catalogacoes', async function (req, res) {
  var search
  if (req.query.search) {
    search = req.query.search
  }
  else {
    search = ""
  }
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

  const numeroRegistros = await TrabalhoAcademico.count({
    where: {
      tituloTrabalho: {
        [Op.substring]: search
      }
    }
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

  TrabalhoAcademico.findAll({
    where: {
      tituloTrabalho: {
        [Op.substring]: search
      }
    },
    limit: registrosPorPagina,
    offset: indiceInicial,
    raw: true,
    order: [['updatedAt', 'DESC']]
  }).then(function (tb_trabalhos) {
    res.render('trabalhos-catalogados', {
      trabalhos: tb_trabalhos,
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

app.get('/contato', function (req, res) {
  res.render('contato')
})


app.get('/analise/:id', async function (req, res) {
  const id = parseInt(req.params.id)
  const analise = await Analise.findByPk(id, { raw: true });

  res.render('analises-preview', { analise: analise })

})

app.post('/login', function (req, res, next) {
  passport.authenticate('local', {
    successRedirect: '/restrito',
    failureRedirect: '/',
    failureFlash: true

  })(req, res, next)
})

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'mmcifpr.noreply@gmail.com',
    pass: SECRET_TEMPORARIO
  }
})

const JWT_SECRET = SECRET_TEMPORARIO

//Recuperar Senha
app.get('/esqueceu-senha', (req, res) => {
  res.render('recuperar-senha')
})

app.post('/esqueceu-senha', async (req, res) => {
  const usuario = await Integrante.findOne({ where: { email: req.body.email }, raw: true })
  if (usuario) {
    const secret = JWT_SECRET + usuario.senhaLogin
    const payload = {
      id: usuario.id,
      email: usuario.email
    }

    const token = jwt.sign(payload, secret, { expiresIn: '15m' })
    const link = 'http://' + req.get('host') + '/redefinir-senha/' + usuario.id + '/' + token

    var mailOptions = {
      from: 'mmcifpr.noreply@gmail.com',
      to: usuario.email,
      subject: 'Recuperação de Senha',
      text: 'Olá, aqui está o link para redefinição de sua senha: ' + link
    }

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        req.flash('error_msg', 'Ocorreu um erro ao enviar o email. Tente novamente.')
        console.log(error)
      }
      else {
        req.flash('success_msg', 'Email enviado com sucesso! Cheque sua caixa de entrada.')
      }
      res.redirect('/esqueceu-senha')

    })

  }
  else {
    req.flash('error_msg', 'Email não cadastrado no sistema!')
    res.redirect('/esqueceu-senha')
  }
})

app.get('/redefinir-senha/:id/:token', async (req, res) => {
  if (!(parseInt(req.params.id))) {
    req.flash('error', 'Ocorreu um erro! Tente novamente.')
    res.redirect('/')
    return
  }

  var usuario = await Integrante.findByPk(parseInt(req.params.id))
  if (!usuario) {
    req.flash('error', 'Link inválido! Tente novamente.')
    res.redirect('/')
    return
  }


  const token = req.params.token
  const secret = JWT_SECRET + usuario.senhaLogin
  try {
    const payload = jwt.verify(token, secret)
    res.render('redefinir-senha', {
      id: req.params.id,
      token: req.params.token
    })
  }
  catch (erro) {
    req.flash('error', 'Link inválido! Tente novamente.')
    res.redirect('/')
    return
  }



})

app.post('/redefinir-senha/:id/:token', async (req, res) => {
  if (!(parseInt(req.params.id))) {
    req.flash('error', 'Ocorreu um erro! Tente novamente.')
    res.redirect('/')
    return
  }

  var usuario = await Integrante.findByPk(parseInt(req.params.id))
  if (!usuario) {
    req.flash('error', 'Ocorreu um erro! Tente novamente.')
    res.redirect('/')
    return
  }


  const token = req.params.token
  const secret = JWT_SECRET + usuario.senhaLogin
  try {
    const payload = jwt.verify(token, secret)
    const { novaSenha, confirmarSenha } = req.body
    console.log('Nova Senha: ' + novaSenha)
    console.log('Confiramr senha: ' + confirmarSenha)

    if (novaSenha != confirmarSenha) {
      req.flash('error_msg', 'As senhas não batem! Tente novamente.')
      res.redirect('/redefinir-senha/' + req.params.id + '/' + req.params.token)
      return
    }
    else {
      bcrypt.genSalt(10, (erro, salt) => {
        bcrypt.hash(novaSenha, salt, async (erro, hash) => {
          await Integrante.update({ senhaLogin: hash }, { where: { id: parseInt(req.params.id) } })
          req.flash('success_msg', 'Sua senha foi atualizada com sucesso!')
          res.redirect('/')
        })
      })
    }
  }
  catch (erro) {
    req.flash('error', 'Ocorreu um erro! Tente novamente.')
    res.redirect('/')
    return
  }
})



// Grupos de rotas
app.use('/dicas-culturais', dicasCulturais)
app.use('/restrito', estaAutenticado, areaRestrita)

// Iniciando o servidor
const PORT = 3000;
app.listen(PORT, function () {
  console.log('Servidor rodando na porta ' + PORT)
})