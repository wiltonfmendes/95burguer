// ============================================
// 95 BURGER — Configuração do Firebase
// ============================================
// 1. Crie um projeto gratuito em https://console.firebase.google.com
// 2. Ative o "Firestore Database" (modo produção) e o "Authentication"
//    (método Email/Senha) — passo a passo completo no README.md
// 3. Em "Configurações do projeto" > "Seus apps" > "Web", copie o
//    objeto de configuração e cole exatamente no lugar do objeto abaixo.

const firebaseConfig = {
  apiKey: "COLE_AQUI_SUA_API_KEY",
  authDomain: "COLE_AQUI.firebaseapp.com",
  projectId: "COLE_AQUI_O_PROJECT_ID",
  storageBucket: "COLE_AQUI.appspot.com",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
