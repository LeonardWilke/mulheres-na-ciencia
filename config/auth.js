const localStrategy = require('passport-local').Strategy
const Integrante = require('../models/Integrante')
const bcrypt = require('bcryptjs')

module.exports = function (passport) {
  passport.use(new localStrategy({ usernameField: 'cpfIntegrante', passwordField: 'senha' }, function (cpfIntegrante, senhaLogin, done) {

    Integrante.findOne({ where: { cpfIntegrante: cpfIntegrante }, raw: true }).then(function (integrante) {
      if (!integrante) {
        return done(null, false, { message: 'Esta integrante não está cadastrada no sistema!' })
      }

      bcrypt.compare(senhaLogin, integrante.senhaLogin, function (err, senhasBatem) {
        if (senhasBatem) {
          return done(null, integrante)
        }
        else {
          return done(null, false, { message: 'Senha Incorreta!' })
        }
      })
    })
  }))

  passport.serializeUser(function (integrante, done) {
    done(null, integrante.id)
  })

  passport.deserializeUser(function (id, done) {
    Integrante.findByPk(id, { raw: true }).then(function (integrante) {
      done(null, integrante)
    })
  })
}