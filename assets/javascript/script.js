function abrirMenuSanduiche() {
  document.getElementById("menu-sanduiche-overlay").style.width = "100%";
}

function fecharMenuSanduiche() {
  document.getElementById("menu-sanduiche-overlay").style.width = "0%";
}

function abrirMenuLogin() {
  document.getElementById("menu-login-overlay").style.width = "100%";
}

function fecharMenuLogin() {
  document.getElementById("menu-login-overlay").style.width = "0";
}

function redirecionarAreaRestrita() {
  window.location.replace("/restrito/")
}

// Desabilitando os links da própria página

var links = document.querySelectorAll('a:not(.botao-voltar-dicas-culturais)')
var urlAtual = window.location.pathname
const origin = window.location.origin

// Lidando com o Dicas Culturais
try {
  if (urlAtual.substring(0, 17) == '/dicas-culturais/') {
    console.log('aaaaaaaaaa')
    urlAtual = '/dicas-culturais/'
  }
} catch (error) {
}


for (let index = 0; index < links.length; index++) {
  const linkAtual = links[index];
  var caminho = linkAtual.href
  caminho = caminho.replace(origin, '')

  if (caminho == urlAtual) {
    linkAtual.classList.add('link-desabilitado')
    linkAtual.setAttribute('onclick', 'return false')
  }
}
