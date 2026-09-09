// ===============================================================
// FIREBASE DO CONVITE DO OTTO
// Cole abaixo a configuração do aplicativo Web criada no Firebase.
// A configuração Web do Firebase NÃO é uma senha.
// ===============================================================

export const firebaseConfig = {
  apiKey: "COLE_AQUI",
  authDomain: "COLE_AQUI.firebaseapp.com",
  projectId: "COLE_AQUI",
  storageBucket: "COLE_AQUI.firebasestorage.app",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI"
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
