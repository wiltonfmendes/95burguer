// ============================================
// 95 BURGER — Loja (app.js)
// ============================================

let configLoja = {};
let categorias = [];
let produtos = [];
let carrinho = []; // [{idCarrinho, produtoId, nome, precoUnitario, quantidade, extrasEscolhidos, observacao}]
let categoriaAtiva = null;
let produtoAtualNaGaveta = null;
let extrasEscolhidosTemp = [];
let quantidadeTemp = 1;

const el = (id) => document.getElementById(id);

// ---------- Carregamento inicial ----------
async function iniciar() {
  await carregarConfig();
  await carregarCategorias();
  await carregarProdutos();
  renderizarTudo();
  ligarEventosGlobais();
  carregarCarrinhoDoStorage();
  atualizarBarraCarrinho();
}

async function carregarConfig() {
  try {
    const doc = await db.collection("config").doc("site").get();
    configLoja = doc.exists ? doc.data() : {};
  } catch (e) {
    console.error("Erro ao carregar config:", e);
    configLoja = {};
  }

  el("nomeLoja").textContent = configLoja.nome || "95 Burger";
  document.title = configLoja.nome || "95 Burger";
  if (configLoja.logoUrl) {
    el("logoLoja").src = resolverLinkImagem(configLoja.logoUrl);
  }
  const statusEl = el("statusLoja");
  const aberta = configLoja.aberta !== false;
  statusEl.innerHTML = aberta
    ? `<span class="bolinha-aberto"></span> Aberto agora ${configLoja.horario ? "· " + configLoja.horario : ""}`
    : `<span class="bolinha-aberto bolinha-fechado"></span> Fechado no momento`;
}

async function carregarCategorias() {
  try {
    const snap = await db.collection("categorias").orderBy("ordem").get();
    categorias = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error("Erro ao carregar categorias:", e);
    categorias = [];
  }
}

async function carregarProdutos() {
  try {
    const snap = await db.collection("produtos").orderBy("nome").get();
    produtos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error("Erro ao carregar produtos:", e);
    produtos = [];
  }
}

// ---------- Renderização ----------
function renderizarTudo(filtroBusca = "") {
  renderizarChipsCategoria();
  renderizarListaProdutos(filtroBusca);
}

function renderizarChipsCategoria() {
  const wrap = el("categoriasScroll");
  wrap.innerHTML = "";
  categorias.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "chip-categoria" + (categoriaAtiva === cat.id ? " ativo" : "");
    btn.textContent = cat.nome;
    btn.addEventListener("click", () => {
      const destino = el("secao-" + cat.id);
      if (destino) destino.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    wrap.appendChild(btn);
  });
}

function renderizarListaProdutos(filtroBusca = "") {
  const lista = el("listaProdutos");
  lista.innerHTML = "";
  const termo = normalizarTexto(filtroBusca);

  const categoriasComItens = categorias
    .map((cat) => ({
      categoria: cat,
      itens: produtos.filter((p) => {
        if (p.categoriaId !== cat.id) return false;
        if (!termo) return true;
        return normalizarTexto(p.nome).includes(termo) || normalizarTexto(p.descricao).includes(termo);
      }),
    }))
    .filter((grupo) => grupo.itens.length > 0);

  if (categoriasComItens.length === 0) {
    lista.innerHTML = `<div class="estado-vazio">Nenhum item encontrado. Tente buscar por outro nome.</div>`;
    return;
  }

  categoriasComItens.forEach(({ categoria, itens }) => {
    const titulo = document.createElement("h2");
    titulo.className = "secao-titulo";
    titulo.id = "secao-" + categoria.id;
    titulo.textContent = categoria.nome;
    lista.appendChild(titulo);

    itens.forEach((produto) => {
      lista.appendChild(criarCardProduto(produto));
    });
  });
}

function criarCardProduto(produto) {
  const card = document.createElement("div");
  const disponivel = produto.disponivel !== false;
  card.className = "produto-card" + (disponivel ? "" : " indisponivel");
  card.innerHTML = `
    <div class="produto-info">
      <p class="produto-nome">${escapeHtml(produto.nome)}</p>
      <p class="produto-desc">${escapeHtml(produto.descricao || "")}</p>
      <p class="produto-preco">${formatarMoeda(produto.preco)}</p>
    </div>
    <div class="produto-imagem-wrap">
      ${produto.imagemUrl ? `<img src="${resolverLinkImagem(produto.imagemUrl)}" alt="${escapeHtml(produto.nome)}" loading="lazy">` : ""}
      ${!disponivel ? `<div class="produto-indisponivel">Indisponível hoje</div>` : ""}
    </div>
  `;
  if (disponivel) {
    card.addEventListener("click", () => abrirGavetaProduto(produto));
  }
  return card;
}

function escapeHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto || "";
  return div.innerHTML;
}

// ---------- Gaveta de produto (personalização) ----------
function abrirGavetaProduto(produto) {
  produtoAtualNaGaveta = produto;
  extrasEscolhidosTemp = [];
  quantidadeTemp = 1;

  el("gavetaProdutoImagem").src = produto.imagemUrl ? resolverLinkImagem(produto.imagemUrl) : "";
  el("gavetaProdutoImagem").style.display = produto.imagemUrl ? "block" : "none";
  el("gavetaProdutoTitulo").textContent = produto.nome;
  el("gavetaProdutoDesc").textContent = produto.descricao || "";

  const wrapExtras = el("gavetaProdutoExtras");
  wrapExtras.innerHTML = "";
  (produto.extras || []).forEach((extra) => {
    const linha = document.createElement("label");
    linha.className = "linha-extra";
    linha.innerHTML = `
      <div>
        <div class="linha-extra-nome">${escapeHtml(extra.nome)}</div>
        ${extra.preco ? `<div class="linha-extra-preco">+ ${formatarMoeda(extra.preco)}</div>` : `<div class="linha-extra-preco">Grátis</div>`}
      </div>
      <div class="checkbox-extra" data-nome="${escapeHtml(extra.nome)}"></div>
    `;
    const caixa = linha.querySelector(".checkbox-extra");
    caixa.addEventListener("click", (ev) => {
      ev.preventDefault();
      const jaEscolhido = extrasEscolhidosTemp.find((e) => e.nome === extra.nome);
      if (jaEscolhido) {
        extrasEscolhidosTemp = extrasEscolhidosTemp.filter((e) => e.nome !== extra.nome);
        caixa.classList.remove("marcado");
      } else {
        extrasEscolhidosTemp.push({ nome: extra.nome, preco: extra.preco || 0 });
        caixa.classList.add("marcado");
      }
      atualizarPrecoGaveta();
    });
    wrapExtras.appendChild(linha);
  });

  el("gavetaProdutoObs").value = "";
  quantidadeTemp = 1;
  el("gavetaProdutoQtd").textContent = quantidadeTemp;
  atualizarPrecoGaveta();
  abrirGaveta("gavetaProduto");
}

function atualizarPrecoGaveta() {
  const totalExtras = extrasEscolhidosTemp.reduce((s, e) => s + (e.preco || 0), 0);
  const total = (produtoAtualNaGaveta.preco + totalExtras) * quantidadeTemp;
  el("gavetaProdutoBtnAdicionar").textContent = `Adicionar · ${formatarMoeda(total)}`;
}

function alterarQuantidadeGaveta(delta) {
  quantidadeTemp = Math.max(1, quantidadeTemp + delta);
  el("gavetaProdutoQtd").textContent = quantidadeTemp;
  atualizarPrecoGaveta();
}

function adicionarAoCarrinho() {
  carrinho.push({
    idCarrinho: gerarId(),
    produtoId: produtoAtualNaGaveta.id,
    nome: produtoAtualNaGaveta.nome,
    precoUnitario: produtoAtualNaGaveta.preco,
    quantidade: quantidadeTemp,
    extrasEscolhidos: [...extrasEscolhidosTemp],
    observacao: el("gavetaProdutoObs").value.trim(),
  });
  salvarCarrinhoNoStorage();
  atualizarBarraCarrinho();
  fecharGaveta("gavetaProduto");
  mostrarToast(`${produtoAtualNaGaveta.nome} adicionado ao carrinho`);
}

// ---------- Carrinho ----------
function calcularTotalItem(item) {
  const totalExtras = (item.extrasEscolhidos || []).reduce((s, e) => s + (e.preco || 0), 0);
  return (item.precoUnitario + totalExtras) * item.quantidade;
}

function calcularSubtotalCarrinho() {
  return carrinho.reduce((s, item) => s + calcularTotalItem(item), 0);
}

function atualizarBarraCarrinho() {
  const qtdTotal = carrinho.reduce((s, i) => s + i.quantidade, 0);
  const barra = el("barraCarrinho");
  if (qtdTotal === 0) {
    barra.classList.remove("visivel");
    return;
  }
  barra.classList.add("visivel");
  el("barraCarrinhoBadge").textContent = qtdTotal;
  el("barraCarrinhoTotal").textContent = formatarMoeda(calcularSubtotalCarrinho());
}

function renderizarCarrinho() {
  const lista = el("listaItensCarrinho");
  lista.innerHTML = "";

  if (carrinho.length === 0) {
    lista.innerHTML = `<div class="estado-vazio">Seu carrinho está vazio.</div>`;
  }

  carrinho.forEach((item) => {
    const div = document.createElement("div");
    div.className = "item-carrinho";
    const extrasTexto = (item.extrasEscolhidos || []).map((e) => e.nome).join(", ");
    div.innerHTML = `
      <div class="item-carrinho-info">
        <div class="item-carrinho-nome">${item.quantidade}x ${escapeHtml(item.nome)}</div>
        ${extrasTexto ? `<div class="item-carrinho-extras">${escapeHtml(extrasTexto)}</div>` : ""}
        ${item.observacao ? `<div class="item-carrinho-obs">"${escapeHtml(item.observacao)}"</div>` : ""}
        <div class="item-carrinho-remover" data-id="${item.idCarrinho}">Remover</div>
      </div>
      <div class="item-carrinho-preco">${formatarMoeda(calcularTotalItem(item))}</div>
    `;
    div.querySelector(".item-carrinho-remover").addEventListener("click", () => {
      carrinho = carrinho.filter((i) => i.idCarrinho !== item.idCarrinho);
      salvarCarrinhoNoStorage();
      renderizarCarrinho();
      atualizarBarraCarrinho();
      atualizarResumoCarrinho();
    });
    lista.appendChild(div);
  });

  atualizarResumoCarrinho();
}

function atualizarResumoCarrinho() {
  const subtotal = calcularSubtotalCarrinho();
  el("resumoSubtotal").textContent = formatarMoeda(subtotal);
  el("resumoTotal").textContent = formatarMoeda(subtotal);
  el("btnIrParaCheckout").disabled = carrinho.length === 0;
}

function salvarCarrinhoNoStorage() {
  localStorage.setItem("95burger_carrinho", JSON.stringify(carrinho));
}
function carregarCarrinhoDoStorage() {
  try {
    const salvo = localStorage.getItem("95burger_carrinho");
    carrinho = salvo ? JSON.parse(salvo) : [];
  } catch (e) {
    carrinho = [];
  }
}

// ---------- Checkout ----------
function finalizarPedido(ev) {
  ev.preventDefault();
  const nome = el("checkoutNome").value.trim();
  const telefone = el("checkoutTelefone").value.trim();
  const endereco = el("checkoutEndereco").value.trim();
  const observacaoGeral = el("checkoutObs").value.trim();

  const mensagem = montarMensagemPedido({
    itens: carrinho,
    nomeCliente: nome,
    telefoneCliente: telefone,
    endereco,
    observacaoGeral,
    totalProdutos: calcularSubtotalCarrinho(),
    taxaEntrega: 0,
    total: calcularSubtotalCarrinho(),
    nomeLoja: configLoja.nome || "95 Burger",
  });

  abrirWhatsApp(configLoja.whatsapp, mensagem);

  carrinho = [];
  salvarCarrinhoNoStorage();
  atualizarBarraCarrinho();
  fecharGaveta("gavetaCheckout");
  fecharGaveta("gavetaCarrinho");
  mostrarToast("Pedido enviado para o WhatsApp da cozinha!");
}

// ---------- Gavetas genéricas ----------
function abrirGaveta(id) {
  el("overlayGeral").classList.add("aberta");
  el(id).classList.add("aberta");
  document.body.style.overflow = "hidden";
}
function fecharGaveta(id) {
  el(id).classList.remove("aberta");
  const algumaAberta = document.querySelectorAll(".gaveta.aberta").length > 0;
  if (!algumaAberta) {
    el("overlayGeral").classList.remove("aberta");
    document.body.style.overflow = "";
  }
}
function fecharTodasGavetas() {
  document.querySelectorAll(".gaveta.aberta").forEach((g) => g.classList.remove("aberta"));
  el("overlayGeral").classList.remove("aberta");
  document.body.style.overflow = "";
}

function mostrarToast(texto) {
  const toast = el("toast");
  toast.textContent = texto;
  toast.classList.add("visivel");
  setTimeout(() => toast.classList.remove("visivel"), 2200);
}

// ---------- Eventos globais ----------
function ligarEventosGlobais() {
  el("overlayGeral").addEventListener("click", fecharTodasGavetas);

  el("buscaInput").addEventListener("input", (e) => renderizarListaProdutos(e.target.value));

  el("btnFecharGavetaProduto").addEventListener("click", () => fecharGaveta("gavetaProduto"));
  el("stepperMenos").addEventListener("click", () => alterarQuantidadeGaveta(-1));
  el("stepperMais").addEventListener("click", () => alterarQuantidadeGaveta(1));
  el("gavetaProdutoBtnAdicionar").addEventListener("click", adicionarAoCarrinho);

  el("barraCarrinho").addEventListener("click", () => {
    renderizarCarrinho();
    abrirGaveta("gavetaCarrinho");
  });
  el("btnFecharGavetaCarrinho").addEventListener("click", () => fecharGaveta("gavetaCarrinho"));
  el("btnIrParaCheckout").addEventListener("click", () => {
    fecharGaveta("gavetaCarrinho");
    abrirGaveta("gavetaCheckout");
  });

  el("btnFecharGavetaCheckout").addEventListener("click", () => fecharGaveta("gavetaCheckout"));
  el("formCheckout").addEventListener("submit", finalizarPedido);
}

document.addEventListener("DOMContentLoaded", iniciar);
