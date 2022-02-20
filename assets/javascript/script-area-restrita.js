function selecionarOpcaoPreDefinida() {
  var elementosSelect = document.querySelectorAll('select')
  for (let index = 0; index < elementosSelect.length; index++) {
    const select = elementosSelect[index];
    const valorPreDefinido = select.getAttribute('id')

    var opcoes = select.children
    for (let index = 0; index < opcoes.length; index++) {
      var opcao = opcoes[index];
      if (opcao.getAttribute('value') == valorPreDefinido) {
        opcao.setAttribute('selected', 'true')
      }
    }

  }
}

function abrirMenuConfirmacaoExclusao(id, atributoIdentificavel) {
  var botaoSim = document.querySelector('.botoes-excluir form')
  valorPadraoBotao = botaoSim.getAttribute('action')
  botaoSim.setAttribute('action', valorPadraoBotao + '' + id)

  var textoConfirmacao = document.querySelector('.overlay-excluir p')
  textoConfirmacao.textContent = 'Deseja mesmo excluir o registro "' + atributoIdentificavel + '"?'

  var menuOverlay = document.querySelector('.overlay-excluir')
  menuOverlay.setAttribute('style', 'width: 100%;')
}

function fecharMenuConfirmacaoExclusao() {
  var botaoSim = document.querySelector('.botoes-excluir form')
  botaoSim.setAttribute('action', valorPadraoBotao)

  var menuOverlay = document.querySelector('.overlay-excluir')
  menuOverlay.setAttribute('style', 'width: 0%;')
}

var valorPadraoBotao