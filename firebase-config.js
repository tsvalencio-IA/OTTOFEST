// ===============================================================
// FIREBASE DO CONVITE DO OTTO
// Cole abaixo a configuração do aplicativo Web criada no Firebase.
// A configuração Web do Firebase NÃO é uma senha.
// ===============================================================

export const firebaseConfig = {
  apiKey: "AIzaSyArXXVD0QnJvDdB9QVNc4QrBNTv-h7HtfQ",
  authDomain: "ottofest-3ca4e.firebaseapp.com",
  projectId: "ottofest-3ca4e",
  storageBucket: "ottofest-3ca4e.firebasestorage.app",
  messagingSenderId: "108804464983",
  appId: "1:108804464983:web:27e7dc21ec214876315e12"
};

// Firestore é usado para:
// - collection "rsvps": confirmações de presença
// - collection "questions": dúvidas enviadas pelo convite
//
// Authentication (E-mail/senha) é usado APENAS para o painel administrativo.


// Login técnico interno do painel.
// O visitante/admin NÃO digita este e-mail na tela.
// Crie no Firebase Authentication um usuário com EXATAMENTE este e-mail
// e escolha a senha que você quiser para o painel.
export const ADMIN_AUTH_EMAIL = "admin@ottofest.app";
