# 95 Burger — Site de pedidos

Site de pedidos estilo iFood para hamburgueria (hambúrgueres, marmitas,
cachorro-quente, bebidas, drinks etc). Sem meio de pagamento no site — o
pedido cai formatado direto no WhatsApp da cozinha, e o pagamento é
combinado com o motoboy na entrega.

## Estrutura dos arquivos

```
95burger/
├── index.html          → site que o cliente usa para fazer pedidos
├── admin.html          → painel para você gerenciar tudo
├── css/style.css        → toda a aparência do site
└── js/
    ├── firebase-config.js  → suas chaves do Firebase (você preenche)
    ├── utils.js             → funções auxiliares (preço, WhatsApp, imagens)
    ├── app.js               → lógica do site do cliente
    └── admin.js             → lógica do painel admin
```

## Por que Firebase?

Você precisa de um lugar para guardar o cardápio (categorias, produtos,
preços, imagens) e o login do administrador — e que seja **gratuito**.
O Firebase (do Google) tem um plano gratuito ("Spark") que cobre isso
tranquilamente para uma hamburgueria: banco de dados (Firestore),
login (Authentication) e hospedagem do site (Hosting), tudo sem custo
dentro dos limites generosos do plano grátis.

## Passo 1 — Criar o projeto Firebase

1. Acesse **https://console.firebase.google.com** e clique em "Criar projeto".
2. Dê um nome (ex: `95burger`) e siga o assistente (pode desativar o
   Google Analytics, não é necessário).
3. Dentro do projeto, no menu lateral, vá em **Compilação → Firestore Database**
   e clique em "Criar banco de dados". Escolha "Iniciar em modo de produção"
   e a região mais próxima (ex: `southamerica-east1` — São Paulo).
4. Ainda no menu lateral, vá em **Compilação → Authentication**, clique em
   "Vamos começar" e ative o método **E-mail/senha**.
5. Em Authentication → aba "Users", clique em "Adicionar usuário" e crie
   o e-mail e senha que você (administrador) vai usar para entrar no
   painel `admin.html`.

## Passo 2 — Pegar as chaves do projeto

1. No menu lateral, clique na engrenagem ⚙️ → "Configurações do projeto".
2. Role até "Seus apps" e clique no ícone **`</>`** (Web) para registrar um app.
3. Dê um apelido (ex: "95burger-web") e clique em registrar — **não**
   precisa marcar Firebase Hosting nessa tela.
4. Copie o objeto `firebaseConfig` que aparece e cole no arquivo
   `js/firebase-config.js`, substituindo os valores de exemplo.

## Passo 3 — Definir as regras de segurança do Firestore

Por padrão o Firestore em "modo produção" bloqueia tudo. Você precisa
permitir que qualquer visitante **leia** o cardápio, mas que só o
administrador logado possa **alterar** os dados.

No console do Firebase, vá em **Firestore Database → Regras** e cole:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

Clique em "Publicar". Isso significa: qualquer pessoa pode ver o
cardápio (necessário para o site funcionar), mas só quem estiver
logado no painel admin pode criar, editar ou excluir algo.

## Passo 4 — Colocar as imagens no Google Drive

Para cada imagem (logo, foto de cada produto):

1. Faça upload da imagem no seu Google Drive normalmente.
2. Clique com o botão direito → "Compartilhar" → mude o acesso para
   **"Qualquer pessoa com o link"** (função: Leitor).
3. Copie o link (algo como
   `https://drive.google.com/file/d/1AbC2dEfG.../view?usp=sharing`).
4. Cole esse link exatamente assim no campo de imagem do painel admin
   — o site converte automaticamente para o formato de exibição.

Se preferir, qualquer outro link direto de imagem (Imgur, um CDN
próprio, etc.) também funciona normalmente.

## Passo 5 — Testar localmente

Abra a pasta `95burger` com qualquer servidor local simples. Duas opções:

- **VS Code**: instale a extensão "Live Server" e clique em "Go Live"
  com o `index.html` aberto.
- **Sem instalar nada**: com Python instalado, rode no terminal, dentro
  da pasta do projeto: `python3 -m http.server 8080` e acesse
  `http://localhost:8080` no navegador.

Acesse `/admin.html` para entrar no painel e cadastrar suas categorias
(ex: Hambúrgueres, Marmitas, Cachorro-quente, Bebidas, Drinks) e depois
os produtos de cada uma.

> Abrir o `index.html` direto com duplo-clique (`file://`) não funciona
> bem com o Firebase — use sempre um servidor local ou o site já publicado.

## Passo 6 — Publicar de graça

**Opção recomendada — Firebase Hosting** (mesmo projeto que você já criou):

1. Instale o Node.js (https://nodejs.org) se ainda não tiver.
2. No terminal, dentro da pasta do projeto, rode:
   ```
   npm install -g firebase-tools
   firebase login
   firebase init hosting
   ```
3. Nas perguntas do `firebase init`: escolha o projeto que você criou,
   responda `.` (a própria pasta atual) como diretório público, `N` para
   "single-page app", e `N` para sobrescrever o `index.html`.
4. Rode `firebase deploy`. Ao final ele mostra o link público do site
   (algo como `https://95burger.web.app`).

**Alternativa — Netlify**: crie uma conta grátis em netlify.com, arraste
a pasta do projeto para a área de deploy do site deles. Funciona igual,
pois o site é só HTML/CSS/JS estático conversando com o Firebase.

## Como funciona o pedido

1. O cliente monta o carrinho, personaliza os itens (adicionais e
   observações) e preenche nome, telefone e endereço.
2. Ao confirmar, o site monta uma mensagem já formatada com todos os
   itens, adicionais, observações e o total, e abre o WhatsApp
   automaticamente (`wa.me`) já com o número da cozinha e a mensagem
   pronta para enviar.
3. Não há cobrança dentro do site — o motoboy leva a maquininha e
   acerta o pagamento na entrega, como combinado.

## Dúvidas comuns

- **"Mudei o WhatsApp no admin e não atualizou no site do cliente"** —
  o cliente precisa recarregar a página; a configuração é buscada a
  cada carregamento.
- **"A imagem não aparece"** — confira se o compartilhamento do Google
  Drive está como "Qualquer pessoa com o link". Se estiver restrito,
  a imagem não carrega para os visitantes.
- **Adicionar mais administradores** — crie outro usuário em
  Authentication → Users com o e-mail da pessoa.
