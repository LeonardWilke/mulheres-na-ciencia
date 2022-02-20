module.exports = {
  eCoordenador: function (req, res, next) {
    if (req.isAuthenticated() && req.user.cargoIntegrante == 'Coordenador') {
      return next()
    }
    req.flash('error_msg', 'Somente coordenadores do projeto podem acessar esta área!')
    res.redirect('/restrito/')
  }
}