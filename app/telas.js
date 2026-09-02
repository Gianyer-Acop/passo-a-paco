// telas.js — registro de telas.
//
// Cada modulo em app/telas/ chama `registrar(chave, { titulo, render })` no
// momento em que e importado. `renderizar(chave, params)` limpa o <main id="tela">
// e entrega o elemento vazio para a funcao `render` da tela.
//
// As 6 chaves validas sao fixas e cada uma pertence a exatamente um modulo:
//   mapa · busca · ponto · linha · quadro · avisos
// O teste-guarda (ferramentas/verificar_contrato.mjs) falha se duas telas
// registrarem a mesma chave ou se aparecer chave fora dessa lista.
//
// Assinaturas CONGELADAS (TASK-02).

const registro = new Map();

/**
 * Registra uma tela. Chamar duas vezes com a mesma chave e erro de programacao.
 *
 * @param {string} chave identificador unico da tela
 * @param {{titulo: string, render: (elemento: HTMLElement, params: object) => void}} tela
 *        `render` recebe o <main id="tela"> JA LIMPO e os params da navegacao.
 */
export function registrar(chave, { titulo, render }) {
  if (registro.has(chave)) {
    throw new Error("Tela '" + chave + "' registrada duas vezes.");
  }
  if (typeof render !== 'function') {
    throw new Error("Tela '" + chave + "' precisa de uma funcao render.");
  }
  registro.set(chave, { titulo, render });
}

/**
 * Renderiza uma tela dentro do <main id="tela">.
 * Limpa o conteudo anterior, marca `data-tela` (gancho de CSS por tela) e
 * ajusta o titulo do documento.
 *
 * @param {string} chave
 * @param {object} [params]
 */
export function renderizar(chave, params = {}) {
  const tela = registro.get(chave);
  const elemento = document.getElementById('tela');
  if (!elemento) throw new Error('<main id="tela"> nao existe no documento.');

  if (!tela) {
    elemento.replaceChildren();
    elemento.dataset.tela = 'desconhecida';
    const aviso = document.createElement('p');
    aviso.className = 'estado-vazio';
    aviso.textContent = 'Tela indisponivel: ' + chave;
    elemento.append(aviso);
    return;
  }

  elemento.replaceChildren();
  elemento.dataset.tela = chave;
  document.title = tela.titulo + ' — Passo a Paço 2026';
  tela.render(elemento, params);
}

/**
 * Chaves registradas ate agora, na ordem de registro.
 * @returns {string[]}
 */
export function chaves() {
  return [...registro.keys()];
}
