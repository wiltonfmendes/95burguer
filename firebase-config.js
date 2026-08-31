// ============================================
// 95 BURGER — Configuração do Firebase
// ============================================
// 1. Crie um projeto gratuito em https://console.firebase.google.com
// 2. Ative o "Firestore Database" (modo produção) e o "Authentication"
//    (método Email/Senha) — passo a passo completo no README.md
// 3. Em "Configurações do projeto" > "Seus apps" > "Web", copie o
//    objeto de configuração e cole exatamente no lugar do objeto abaixo.

const firebaseConfig = {
  apiKey: "AIzaSyDzRoQrnXi43eJ3bJHF6ZYOHMrkaUbs8-c",
  authDomain: "burguer-134a2.firebaseapp.com",
  projectId: "burguer-134a2",
  storageBucket: "burguer-134a2.firebasestorage.app",
  messagingSenderId: "10281038756",
  appId: "1:10281038756:web:69bef79b0bb3912a4cc731",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
