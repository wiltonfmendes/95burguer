// ============================================
// 95 BURGER — Painel do administrador (admin.js)
// ============================================

const el = (id) => document.getElementById(id);

let categorias = [];
let produtos = [];
let editandoProdutoId = null;
let editandoCategoriaId = null;

// ---------- Autenticação ----------
auth.onAuthStateChanged((user) => {
  if (user) {
    el("telaLogin").style.display = "none";
    el("telaAdmin").style.display = "block";
    iniciarAdmin();
  } else {
    el("telaLogin").style.display = "flex";
    el("telaAdmin").style.display = "none";
  }
});

el("formLogin").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = el("loginEmail").value.trim();
  const senha = el("loginSenha").value;
  el("loginErro").textContent = "";
  auth.signInWithEmailAndPassword(email, senha).catch((err) => {
    el("loginErro").textContent = "E-mail ou senha inválidos.";
    console.error(err);
  });
});

el("btnSair").addEventListener("click", () => auth.signOut());

// ---------- Navegação por abas ----------
function mudarAba(nome) {
  document.querySelectorAll(".admin-aba").forEach((b) => b.classList.remove("ativa"));
  document.querySelectorAll(".admin-painel").forEach((p) => (p.style.display = "none"));
  el("aba-" + nome).classList.add("ativa");
  el("painel-" + nome).style.display = "block";
}
document.querySelectorAll(".admin-aba").forEach((btn) => {
  btn.addEventListener("click", () => mudarAba(btn.dataset.aba));
});

// ---------- Inicialização ----------
async function iniciarAdmin() {
  await carregarConfigAdmin();
  await carregarCategoriasAdmin();
  await carregarProdutosAdmin();
  renderizarCategoriasAdmin();
  renderizarProdutosAdmin();
  preencherSelectCategorias();
}

// ---------- Config do site ----------
async function carregarConfigAdmin() {
  const doc = await db.collection("config").doc("site").get();
  const dados = doc.exists ? doc.data() : {};
  el("cfgNome").value = dados.nome || "";
  el("cfgWhatsapp").value = dados.whatsapp || "";
  el("cfgLogo").value = dados.logoUrl || "";
  el("cfgHorario").value = dados.horario || "";
  el("cfgAberta").checked = dados.aberta !== false;
  atualizarPreviaImagem("cfgLogo", "cfgLogoPrevia");
}

el("formConfig").addEventListener("submit", async (e) => {
  e.preventDefault();
  await db.collection("config").doc("site").set({
    nome: el("cfgNome").value.trim(),
    whatsapp: el("cfgWhatsapp").value.trim(),
    logoUrl: el("cfgLogo").value.trim(),
    horario: el("cfgHorario").value.trim(),
    aberta: el("cfgAberta").checked,
  });
  mostrarToastAdmin("Configurações salvas!");
});

el("cfgLogo").addEventListener("input", () => atualizarPreviaImagem("cfgLogo", "cfgLogoPrevia"));

function atualizarPreviaImagem(idInput, idImg) {
  const url = el(idInput).value.trim();
  const img = el(idImg);
  if (url) {
    img.src = resolverLinkImagem(url);
    img.style.display = "block";
  } else {
    img.style.display = "none";
  }
}

// ---------- Categorias ----------
async function carregarCategoriasAdmin() {
  const snap = await db.collection("categorias").orderBy("ordem").get();
  categorias = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function renderizarCategoriasAdmin() {
  const wrap = el("listaCategoriasAdmin");
  wrap.innerHTML = "";
  if (categorias.length === 0) {
    wrap.innerHTML = `<p class="admin-card-ajuda">Nenhuma categoria ainda. Crie a primeira acima (ex: "Hambúrgueres", "Marmitas", "Cachorro-quente", "Bebidas").</p>`;
  }
  categorias.forEach((cat) => {
    const linha = document.createElement("div");
    linha.className = "admin-linha-produto";
    linha.innerHTML = `
      <div class="admin-linha-produto-info">
        <div class="admin-linha-produto-nome">${cat.nome}</div>
        <div class="admin-linha-produto-meta">ordem: ${cat.ordem ?? 0}</div>
      </div>
      <div class="admin-linha-acoes">
        <button class="icone-btn" data-acao="editar">✏️</button>
        <button class="icone-btn" data-acao="excluir">🗑️</button>
      </div>
    `;
    linha.querySelector('[data-acao="editar"]').addEventListener("click", () => editarCategoria(cat));
    linha.querySelector('[data-acao="excluir"]').addEventListener("click", () => excluirCategoria(cat));
    wrap.appendChild(linha);
  });
}

function editarCategoria(cat) {
  editandoCategoriaId = cat.id;
  el("catNome").value = cat.nome;
  el("catOrdem").value = cat.ordem ?? 0;
  el("btnSalvarCategoria").textContent = "Salvar alterações";
  el("catNome").scrollIntoView({ behavior: "smooth", block: "center" });
}

async function excluirCategoria(cat) {
  const emUso = produtos.some((p) => p.categoriaId === cat.id);
  if (emUso) {
    alert("Essa categoria tem produtos vinculados. Mova ou exclua os produtos dessa categoria primeiro.");
    return;
  }
  if (!confirm(`Excluir a categoria "${cat.nome}"?`)) return;
  await db.collection("categorias").doc(cat.id).delete();
  await carregarCategoriasAdmin();
  renderizarCategoriasAdmin();
  preencherSelectCategorias();
}

el("formCategoria").addEventListener("submit", async (e) => {
  e.preventDefault();
  const dados = {
    nome: el("catNome").value.trim(),
    ordem: Number(el("catOrdem").value) || 0,
  };
  if (editandoCategoriaId) {
    await db.collection("categorias").doc(editandoCategoriaId).update(dados);
  } else {
    await db.collection("categorias").add(dados);
  }
  editandoCategoriaId = null;
  el("btnSalvarCategoria").textContent = "Adicionar categoria";
  el("formCategoria").reset();
  await carregarCategoriasAdmin();
  renderizarCategoriasAdmin();
  preencherSelectCategorias();
  mostrarToastAdmin("Categoria salva!");
});

function preencherSelectCategorias() {
  const select = el("prodCategoria");
  select.innerHTML = "";
  categorias.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = cat.nome;
    select.appendChild(opt);
  });
}

// ---------- Produtos ----------
async function carregarProdutosAdmin() {
  const snap = await db.collection("produtos").orderBy("nome").get();
  produtos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function renderizarProdutosAdmin() {
  const wrap = el("listaProdutosAdmin");
  wrap.innerHTML = "";
  if (produtos.length === 0) {
    wrap.innerHTML = `<p class="admin-card-ajuda">Nenhum produto cadastrado ainda.</p>`;
  }
  produtos.forEach((prod) => {
    const cat = categorias.find((c) => c.id === prod.categoriaId);
    const disponivel = prod.disponivel !== false;
    const linha = document.createElement("div");
    linha.className = "admin-linha-produto";
    linha.innerHTML = `
      <img src="${prod.imagemUrl ? resolverLinkImagem(prod.imagemUrl) : ""}" alt="">
      <div class="admin-linha-produto-info">
        <div class="admin-linha-produto-nome">${prod.nome}</div>
        <div class="admin-linha-produto-meta">${cat ? cat.nome : "sem categoria"} · ${formatarMoeda(prod.preco)}</div>
        <span class="${disponivel ? "tag-disponivel" : "tag-indisponivel"}">${disponivel ? "Disponível" : "Indisponível"}</span>
      </div>
      <div class="admin-linha-acoes">
        <button class="icone-btn" data-acao="editar">✏️</button>
        <button class="icone-btn" data-acao="excluir">🗑️</button>
      </div>
    `;
    linha.querySelector('[data-acao="editar"]').addEventListener("click", () => editarProduto(prod));
    linha.querySelector('[data-acao="excluir"]').addEventListener("click", () => excluirProduto(prod));
    wrap.appendChild(linha);
  });
}

function editarProduto(prod) {
  editandoProdutoId = prod.id;
  el("prodNome").value = prod.nome;
  el("prodDescricao").value = prod.descricao || "";
  el("prodPreco").value = prod.preco;
  el("prodCategoria").value = prod.categoriaId;
  el("prodImagem").value = prod.imagemUrl || "";
  el("prodDisponivel").checked = prod.disponivel !== false;
  el("prodExtrasTexto").value = (prod.extras || [])
    .map((ex) => `${ex.nome}${ex.preco ? " | " + ex.preco : ""}`)
    .join("\n");
  atualizarPreviaImagem("prodImagem", "prodImagemPrevia");
  el("btnSalvarProduto").textContent = "Salvar alterações";
  el("tituloFormProduto").textContent = "Editar produto";
  el("formProduto").scrollIntoView({ behavior: "smooth", block: "center" });
}

async function excluirProduto(prod) {
  if (!confirm(`Excluir o produto "${prod.nome}"?`)) return;
  await db.collection("produtos").doc(prod.id).delete();
  await carregarProdutosAdmin();
  renderizarProdutosAdmin();
}

function limparFormProduto() {
  editandoProdutoId = null;
  el("formProduto").reset();
  el("btnSalvarProduto").textContent = "Adicionar produto";
  el("tituloFormProduto").textContent = "Novo produto";
  el("prodImagemPrevia").style.display = "none";
}
el("btnNovoProduto").addEventListener("click", limparFormProduto);
el("prodImagem").addEventListener("input", () => atualizarPreviaImagem("prodImagem", "prodImagemPrevia"));

function interpretarExtras(texto) {
  return texto
    .split("\n")
    .map((linha) => linha.trim())
    .filter(Boolean)
    .map((linha) => {
      const [nome, preco] = linha.split("|").map((s) => s.trim());
      return { nome, preco: preco ? Number(preco.replace(",", ".")) : 0 };
    });
}

el("formProduto").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (categorias.length === 0) {
    alert("Crie uma categoria antes de adicionar produtos.");
    return;
  }
  const dados = {
    nome: el("prodNome").value.trim(),
    descricao: el("prodDescricao").value.trim(),
    preco: Number(el("prodPreco").value.replace(",", ".")),
    categoriaId: el("prodCategoria").value,
    imagemUrl: el("prodImagem").value.trim(),
    disponivel: el("prodDisponivel").checked,
    extras: interpretarExtras(el("prodExtrasTexto").value),
  };
  if (editandoProdutoId) {
    await db.collection("produtos").doc(editandoProdutoId).update(dados);
  } else {
    await db.collection("produtos").add(dados);
  }
  limparFormProduto();
  await carregarProdutosAdmin();
  renderizarProdutosAdmin();
  mostrarToastAdmin("Produto salvo!");
});

function mostrarToastAdmin(texto) {
  const toast = el("toastAdmin");
  toast.textContent = texto;
  toast.classList.add("visivel");
  setTimeout(() => toast.classList.remove("visivel"), 2200);
}
