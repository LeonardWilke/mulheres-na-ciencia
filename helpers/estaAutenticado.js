module.exports = {
  estaAutenticado: function (req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    }
    req.flash('error', 'Você deve se autenticar para acessar a área restrita do site!')
    res.redirect('/')
  }
}