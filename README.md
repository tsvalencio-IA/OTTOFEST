# 🎂 Aniversário do Otto — Convite Interativo

Projeto pronto para GitHub Pages + Firebase Firestore.

## O que já está pronto

- Convite responsivo para celular.
- Kirby e Waddle Dee com animações e efeitos de ação.
- Jogo das 7 estrelas.
- Data, horário e local.
- Botão "Como chegar".
- Confirmação de presença salva no Firestore.
- Dúvidas salvas no Firestore.
- Painel administrativo escondido:
  - toque **3 vezes** em `desenvolvido por thIAguinho Soluções Digitais`;
  - login por Firebase Authentication (e-mail/senha);
  - dashboard de confirmações, total de pessoas e dúvidas;
  - dúvidas pendentes/resolvidas;
  - exportação CSV.

## Estrutura

- `index.html` — convite + painel administrativo.
- `styles.css` — visual completo.
- `app.js` — interações, Firestore e painel.
- `firebase-config.js` — ÚNICO arquivo que precisa receber sua configuração Firebase.
- `firestore.rules` — regras para copiar no Firestore.
- `assets/` — imagens do convite.
- `.nojekyll` — evita interferência do Jekyll no GitHub Pages.

---

# CONFIGURAÇÃO OBRIGATÓRIA DO FIREBASE

O site está completo, mas nenhum projeto externo pode gravar em banco sem saber QUAL Firebase usar.

### 1. Crie/abra um projeto no Firebase

No console Firebase:
- Firestore Database → criar banco.
- Authentication → Sign-in method → habilitar **E-mail/senha**.
- Authentication → Users → criar manualmente o usuário administrador.

Não coloque botão de cadastro público no site. O painel aceita somente os usuários que você criar no Firebase Authentication.

### 2. Crie um aplicativo Web no Firebase

Configurações do projeto → Seus apps → `</>` Web.

Copie os valores fornecidos pelo Firebase.

### 3. Abra `firebase-config.js`

Substitua somente os `COLE_AQUI`.

Exemplo do formato:

```js
export const firebaseConfig = {
  apiKey: "...",
  authDomain: "...firebaseapp.com",
  projectId: "...",
  storageBucket: "...firebasestorage.app",
  messagingSenderId: "...",
  appId: "..."
};
```

### 4. Publique as regras

Firestore Database → Rules.

Apague o conteúdo atual, cole todo o arquivo `firestore.rules` e clique em **Publish**.

### 5. Suba no GitHub

Crie o repositório:
`aniversario-do-otto`

Envie TODOS os arquivos e a pasta `assets`.

GitHub → Settings → Pages:
- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`
- Save.

---

## Importante sobre segurança

Os 3 toques no rodapé são somente uma entrada escondida para o painel.  
A segurança real é o login do Firebase Authentication + as regras do Firestore.

Visitantes:
- podem enviar confirmação;
- podem enviar dúvida;
- NÃO podem listar confirmações;
- NÃO podem listar dúvidas.

Usuário autenticado no Firebase:
- consegue abrir o dashboard.

---

design by **thIAguinho Soluções Digitais**
