import { firebaseConfig, ADMIN_AUTH_EMAIL } from "./firebase-config.js";

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
  getFirestore, collection, addDoc, serverTimestamp, onSnapshot,
  query, orderBy, doc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const $ = (id) => document.getElementById(id);

const els = {
  kirbyButton: $("kirbyButton"),
  kirbySpeech: $("kirbySpeech"),
  waddleButton: $("waddleButton"),
  starCount: $("starCount"),
  stars: [...document.querySelectorAll(".star")],
  rsvpForm: $("rsvpForm"),
  rsvpName: $("rsvpName"),
  rsvpGuests: $("rsvpGuests"),
  rsvpNote: $("rsvpNote"),
  rsvpWebsite: $("rsvpWebsite"),
  rsvpSubmit: $("rsvpSubmit"),
  rsvpStatus: $("rsvpStatus"),
  questionForm: $("questionForm"),
  questionName: $("questionName"),
  questionTopic: $("questionTopic"),
  questionMessage: $("questionMessage"),
  questionWebsite: $("questionWebsite"),
  questionSubmit: $("questionSubmit"),
  questionStatus: $("questionStatus"),
  adminSecret: $("adminSecret"),
  adminDialog: $("adminDialog"),
  adminClose: $("adminClose"),
  adminLoginView: $("adminLoginView"),
  adminDashboardView: $("adminDashboardView"),
  adminLoginForm: $("adminLoginForm"),
  adminPassword: $("adminPassword"),
  adminLoginButton: $("adminLoginButton"),
  adminLoginStatus: $("adminLoginStatus"),
  adminLogout: $("adminLogout"),
  adminUserLabel: $("adminUserLabel"),
  statRsvps: $("statRsvps"),
  statPeople: $("statPeople"),
  statQuestions: $("statQuestions"),
  statPending: $("statPending"),
  rsvpTableBody: $("rsvpTableBody"),
  questionList: $("questionList"),
  rsvpSearch: $("rsvpSearch"),
  questionFilter: $("questionFilter"),
  exportCsv: $("exportCsv"),

  gameButtons: [...document.querySelectorAll("[data-game]")],
  gameDialog: $("gameDialog"),
  gameDialogClose: $("gameDialogClose"),
  gameDialogTitle: $("gameDialogTitle"),
  gameContent: $("gameContent"),

  guestEditorDialog: $("guestEditorDialog"),
  guestEditorForm: $("guestEditorForm"),
  guestEditorClose: $("guestEditorClose"),
  guestEditorCancel: $("guestEditorCancel"),
  guestEditId: $("guestEditId"),
  guestEditName: $("guestEditName"),
  guestEditGuests: $("guestEditGuests"),
  guestEditNote: $("guestEditNote"),
  guestEditorSave: $("guestEditorSave"),
  guestEditorStatus: $("guestEditorStatus"),

  toast: $("toast")
};

const firebaseReady = Boolean(
  firebaseConfig &&
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  !String(firebaseConfig.apiKey).includes("COLE_AQUI") &&
  !String(firebaseConfig.projectId).includes("COLE_AQUI")
);

let db = null;
let auth = null;
let currentRsvps = [];
let currentQuestions = [];
let stopRsvps = null;
let stopQuestions = null;

if (firebaseReady) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      showLogin();
      stopAdminListeners();
      return;
    }
    showDashboard(user);
    startAdminListeners();
  });
} else {
  console.warn("Firebase ainda não configurado. Edite firebase-config.js.");
}

const speeches = [
  "Oi! Tenho um convite muito especial para você!",
  "Dia 26/09 vamos comemorar os 7 anos do Otto! 🎂",
  "Vai ser a partir das 13h13, na chácara da vovó Stela! ⭐",
  "Não esquece de confirmar sua presença aqui embaixo! 💗"
];
let speechIndex = 0;
let foundStars = 0;
let secretTaps = [];
let audioCtx = null;

function setStatus(el, message, kind = "") {
  el.textContent = message;
  el.className = `form-status ${kind}`.trim();
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove("show"), 2200);
}

function animate(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 900);
}

function ensureAudio() {
  if (audioCtx) return audioCtx;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  audioCtx = new AudioContext();
  return audioCtx;
}

function tone(freq = 520, duration = 0.07, end = 360) {
  const ctx = ensureAudio();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const now = ctx.currentTime;
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(80, end), now + duration);
  gain.gain.setValueAtTime(0.04, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration);
}

els.kirbyButton.addEventListener("click", () => {
  tone(320, .12, 760);
  animate(els.kirbyButton, "bounce");
  speechIndex = (speechIndex + 1) % speeches.length;
  els.kirbySpeech.textContent = speeches[speechIndex];
});

els.waddleButton.addEventListener("click", () => {
  tone(530, .07, 370);
  animate(els.waddleButton, "wiggle");
  showToast("Waddle Dee: roupa de banho + churrasco! 🏊🔥");
});

els.stars.forEach((star) => {
  star.addEventListener("click", () => {
    if (star.classList.contains("found")) return;
    star.classList.add("found");
    foundStars += 1;
    els.starCount.textContent = `${foundStars}/7 ⭐`;
    tone(760, .08, 1080);
    if (foundStars === 7) {
      animate(els.kirbyButton, "celebrate");
      showToast("Você encontrou as 7 estrelas do Otto! ⭐");
      setTimeout(() => tone(980, .12, 1260), 100);
    }
  });
});

function requireFirebase(statusEl) {
  if (firebaseReady && db) return true;
  setStatus(statusEl, "O banco ainda não foi configurado. Falta preencher firebase-config.js.", "error");
  return false;
}

els.rsvpForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!requireFirebase(els.rsvpStatus)) return;
  if (els.rsvpWebsite.value.trim()) return;

  const name = els.rsvpName.value.trim().replace(/\s+/g, " ");
  const guests = Number.parseInt(els.rsvpGuests.value, 10);
  const note = els.rsvpNote.value.trim();

  if (name.length < 2) {
    els.rsvpName.focus();
    setStatus(els.rsvpStatus, "Digite seu nome para confirmar.", "error");
    return;
  }
  if (!Number.isInteger(guests) || guests < 1 || guests > 8) {
    setStatus(els.rsvpStatus, "Escolha uma quantidade válida de pessoas.", "error");
    return;
  }

  els.rsvpSubmit.disabled = true;
  setStatus(els.rsvpStatus, "Registrando sua confirmação...");
  try {
    await addDoc(collection(db, "rsvps"), {
      name,
      guests,
      note: note.slice(0, 240),
      createdAt: serverTimestamp(),
      source: "convite-otto"
    });
    localStorage.setItem("otto-rsvp-sent", "1");
    els.rsvpForm.reset();
    setStatus(els.rsvpStatus, "Presença confirmada! Obrigado 💗", "success");
    showToast("Presença confirmada! 🎂");
    tone(860, .11, 1100);
  } catch (error) {
    console.error(error);
    setStatus(els.rsvpStatus, "Não foi possível registrar agora. Tente novamente.", "error");
  } finally {
    els.rsvpSubmit.disabled = false;
  }
});

els.questionForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!requireFirebase(els.questionStatus)) return;
  if (els.questionWebsite.value.trim()) return;

  const name = els.questionName.value.trim().replace(/\s+/g, " ");
  const topic = els.questionTopic.value;
  const message = els.questionMessage.value.trim();

  if (name.length < 2) {
    els.questionName.focus();
    setStatus(els.questionStatus, "Digite seu nome.", "error");
    return;
  }
  if (message.length < 3) {
    els.questionMessage.focus();
    setStatus(els.questionStatus, "Escreva sua dúvida.", "error");
    return;
  }

  els.questionSubmit.disabled = true;
  setStatus(els.questionStatus, "Enviando sua dúvida...");
  try {
    await addDoc(collection(db, "questions"), {
      name,
      topic,
      message: message.slice(0, 500),
      status: "pending",
      createdAt: serverTimestamp(),
      source: "convite-otto"
    });
    els.questionForm.reset();
    setStatus(els.questionStatus, "Dúvida enviada! Ela já apareceu no painel administrativo.", "success");
    showToast("Dúvida registrada. ✅");
  } catch (error) {
    console.error(error);
    setStatus(els.questionStatus, "Não foi possível enviar agora. Tente novamente.", "error");
  } finally {
    els.questionSubmit.disabled = false;
  }
});


/* ==========================================================
   MINI-JOGOS - locais, sem gravar dados no Firebase
   ========================================================== */
let gameCleanup = null;

function cleanupGame() {
  if (typeof gameCleanup === "function") gameCleanup();
  gameCleanup = null;
}

function openGame(type) {
  cleanupGame();
  if (typeof els.gameDialog.showModal === "function") {
    if (!els.gameDialog.open) els.gameDialog.showModal();
  } else {
    els.gameDialog.setAttribute("open", "");
  }

  if (type === "stars") renderCatchStars();
  if (type === "memory") renderMemoryGame();
  if (type === "bag") renderBagGame();
}

function closeGame() {
  cleanupGame();
  if (typeof els.gameDialog.close === "function") els.gameDialog.close();
  else els.gameDialog.removeAttribute("open");
}

els.gameButtons.forEach((button) => {
  button.addEventListener("click", () => {
    tone(520, .06, 360);
    openGame(button.dataset.game);
  });
});
els.gameDialogClose.addEventListener("click", closeGame);
els.gameDialog.addEventListener("click", (event) => {
  if (event.target === els.gameDialog) closeGame();
});

function renderCatchStars() {
  els.gameDialogTitle.textContent = "Kirby • Caça às Estrelas";
  els.gameContent.innerHTML = `
    <div class="game-intro">
      <p>Pegue <strong>10 estrelas</strong> em 20 segundos. Vale toque ou clique.</p>
      <div class="game-score">
        <span class="game-pill" id="catchScore">0/10 ⭐</span>
        <span class="game-pill" id="catchTimer">20s</span>
      </div>
    </div>
    <div class="catch-arena" id="catchArena">
      <img class="catch-kirby" src="./assets/kirby.jpg" alt="">
      <button class="catch-target" id="catchTarget" type="button" aria-label="Pegar estrela" hidden>⭐</button>
    </div>
    <div class="game-result" id="catchResult">Toque em “Começar”.</div>
    <button class="game-start" id="catchStart" type="button">Começar</button>
  `;

  const arena = $("catchArena");
  const target = $("catchTarget");
  const scoreEl = $("catchScore");
  const timerEl = $("catchTimer");
  const result = $("catchResult");
  const start = $("catchStart");

  let score = 0;
  let seconds = 20;
  let timer = null;
  let running = false;

  function moveTarget() {
    const maxX = Math.max(8, arena.clientWidth - 62);
    const maxY = Math.max(8, arena.clientHeight - 62);
    const x = 8 + Math.random() * (maxX - 8);
    const y = 8 + Math.random() * (maxY - 8);
    target.style.left = `${x}px`;
    target.style.top = `${y}px`;
  }

  function finish(won) {
    running = false;
    clearInterval(timer);
    timer = null;
    target.hidden = true;
    start.disabled = false;
    start.textContent = "Jogar novamente";
    if (won) {
      result.textContent = "Você pegou as 10 estrelas! ⭐🏆";
      animate(els.kirbyButton, "celebrate");
      tone(900, .12, 1180);
    } else {
      result.textContent = `Tempo! Você pegou ${score} de 10 estrelas.`;
    }
  }

  target.addEventListener("click", () => {
    if (!running) return;
    score += 1;
    scoreEl.textContent = `${score}/10 ⭐`;
    tone(760, .05, 1030);
    if (score >= 10) finish(true);
    else moveTarget();
  });

  start.addEventListener("click", () => {
    clearInterval(timer);
    score = 0;
    seconds = 20;
    running = true;
    scoreEl.textContent = "0/10 ⭐";
    timerEl.textContent = "20s";
    result.textContent = "Vai! Pegue as estrelas.";
    start.disabled = true;
    target.hidden = false;
    moveTarget();

    timer = setInterval(() => {
      seconds -= 1;
      timerEl.textContent = `${seconds}s`;
      if (seconds <= 0) finish(score >= 10);
    }, 1000);
  });

  gameCleanup = () => clearInterval(timer);
}

function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function renderMemoryGame() {
  els.gameDialogTitle.textContent = "Kirby + Waddle Dee • Memória";

  const cards = shuffle([
    { key: "kirby", type: "img", value: "./assets/kirby.jpg", label: "Kirby" },
    { key: "kirby", type: "img", value: "./assets/kirby.jpg", label: "Kirby" },
    { key: "waddle", type: "img", value: "./assets/waddle-dee.jpg", label: "Waddle Dee" },
    { key: "waddle", type: "img", value: "./assets/waddle-dee.jpg", label: "Waddle Dee" },
    { key: "star", type: "emoji", value: "⭐", label: "Estrela" },
    { key: "star", type: "emoji", value: "⭐", label: "Estrela" },
    { key: "cake", type: "emoji", value: "🎂", label: "Bolo" },
    { key: "cake", type: "emoji", value: "🎂", label: "Bolo" }
  ]);

  els.gameContent.innerHTML = `
    <div class="game-intro">
      <p>Encontre os <strong>4 pares</strong>. As cartas funcionam por toque ou clique.</p>
      <div class="game-score">
        <span class="game-pill" id="memoryMoves">0 jogadas</span>
        <span class="game-pill" id="memoryPairs">0/4 pares</span>
      </div>
    </div>
    <div class="memory-grid" id="memoryGrid"></div>
    <div class="game-result" id="memoryResult">Escolha duas cartas.</div>
    <button class="game-start" id="memoryReset" type="button">Embaralhar novamente</button>
  `;

  const grid = $("memoryGrid");
  const movesEl = $("memoryMoves");
  const pairsEl = $("memoryPairs");
  const result = $("memoryResult");
  let opened = [];
  let locked = false;
  let moves = 0;
  let pairs = 0;

  cards.forEach((card, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "memory-card";
    button.dataset.index = String(index);
    button.dataset.key = card.key;
    button.setAttribute("aria-label", "Carta fechada");

    const back = card.type === "img"
      ? `<img src="${card.value}" alt="${card.label}">`
      : `<span aria-label="${card.label}">${card.value}</span>`;

    button.innerHTML = `<span class="memory-front">?</span><span class="memory-back">${back}</span>`;
    grid.appendChild(button);

    button.addEventListener("click", () => {
      if (locked || button.classList.contains("matched") || button.classList.contains("flipped")) return;

      button.classList.add("flipped");
      opened.push(button);
      tone(520, .045, 420);

      if (opened.length !== 2) return;
      moves += 1;
      movesEl.textContent = `${moves} ${moves === 1 ? "jogada" : "jogadas"}`;

      const [a, b] = opened;
      if (a.dataset.key === b.dataset.key) {
        a.classList.add("matched");
        b.classList.add("matched");
        a.classList.remove("flipped");
        b.classList.remove("flipped");
        opened = [];
        pairs += 1;
        pairsEl.textContent = `${pairs}/4 pares`;
        tone(760, .07, 1040);
        if (pairs === 4) {
          result.textContent = `Você encontrou tudo em ${moves} jogadas! 🏆`;
        } else {
          result.textContent = "Par encontrado! Continue.";
        }
      } else {
        locked = true;
        result.textContent = "Não foi dessa vez. Tente outro par.";
        setTimeout(() => {
          a.classList.remove("flipped");
          b.classList.remove("flipped");
          opened = [];
          locked = false;
        }, 700);
      }
    });
  });

  $("memoryReset").addEventListener("click", renderMemoryGame);
  gameCleanup = () => {};
}

function renderBagGame() {
  els.gameDialogTitle.textContent = "Waddle Dee • Mochila da Festa";

  const items = shuffle([
    { icon: "🏊", label: "Roupa de banho", ok: true },
    { icon: "🔥", label: "Algo para o churrasco", ok: true },
    { icon: "🥤", label: "Bebida preferida", ok: true },
    { icon: "🎿", label: "Esqui", ok: false },
    { icon: "📚", label: "Material escolar", ok: false },
    { icon: "🛼", label: "Patins", ok: false }
  ]);

  els.gameContent.innerHTML = `
    <div class="game-intro">
      <p>Escolha as <strong>3 coisas certas</strong> para levar à festa do Otto.</p>
      <div class="game-score"><span class="game-pill" id="bagScore">0/3 certas</span></div>
    </div>
    <div class="bag-grid" id="bagGrid"></div>
    <div class="game-result" id="bagResult">Toque nos itens que combinam com o convite.</div>
    <button class="game-start" id="bagReset" type="button">Recomeçar</button>
  `;

  const grid = $("bagGrid");
  const scoreEl = $("bagScore");
  const result = $("bagResult");
  let correct = 0;

  items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "bag-item";
    button.innerHTML = `<b>${item.icon}</b><span>${item.label}</span>`;
    grid.appendChild(button);

    button.addEventListener("click", () => {
      if (button.classList.contains("selected")) return;

      if (item.ok) {
        button.classList.add("selected");
        button.disabled = true;
        correct += 1;
        scoreEl.textContent = `${correct}/3 certas`;
        tone(720, .06, 980);
        if (correct === 3) {
          result.textContent = "Mochila pronta! Você lembrou de tudo. 🎒⭐";
          animate(els.waddleButton, "celebrate");
        } else {
          result.textContent = "Boa! Falta mais.";
        }
      } else {
        button.classList.add("wrong");
        result.textContent = "Esse item não estava nas dicas do Waddle Dee.";
        tone(260, .08, 180);
        setTimeout(() => button.classList.remove("wrong"), 420);
      }
    });
  });

  $("bagReset").addEventListener("click", renderBagGame);
  gameCleanup = () => {};
}


/* 3 toques na assinatura em até 1,35 s */
els.adminSecret.addEventListener("click", () => {
  const now = Date.now();
  secretTaps = secretTaps.filter((time) => now - time <= 1350);
  secretTaps.push(now);
  if (secretTaps.length >= 3) {
    secretTaps = [];
    openAdmin();
  }
});

function openAdmin() {
  if (typeof els.adminDialog.showModal === "function") {
    if (!els.adminDialog.open) els.adminDialog.showModal();
  } else {
    els.adminDialog.setAttribute("open", "");
  }
  if (!firebaseReady) {
    showLogin();
    setStatus(els.adminLoginStatus, "Firebase ainda não configurado. Preencha firebase-config.js.", "error");
  }
}

els.adminClose.addEventListener("click", () => {
  if (typeof els.adminDialog.close === "function") els.adminDialog.close();
  else els.adminDialog.removeAttribute("open");
});

els.adminDialog.addEventListener("click", (event) => {
  if (event.target === els.adminDialog) els.adminClose.click();
});

els.adminLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!firebaseReady || !auth) {
    setStatus(els.adminLoginStatus, "Configure o Firebase primeiro.", "error");
    return;
  }
  const password = els.adminPassword.value;
  if (!ADMIN_AUTH_EMAIL || ADMIN_AUTH_EMAIL.includes("COLE_AQUI")) {
    setStatus(els.adminLoginStatus, "Falta configurar o acesso administrativo no firebase-config.js.", "error");
    return;
  }

  els.adminLoginButton.disabled = true;
  setStatus(els.adminLoginStatus, "Entrando...");
  try {
    await signInWithEmailAndPassword(auth, ADMIN_AUTH_EMAIL, password);
    els.adminPassword.value = "";
    setStatus(els.adminLoginStatus, "");
  } catch (error) {
    console.error(error);
    setStatus(els.adminLoginStatus, "Senha administrativa inválida.", "error");
  } finally {
    els.adminLoginButton.disabled = false;
  }
});

els.adminLogout.addEventListener("click", async () => {
  if (auth) await signOut(auth);
});

function showLogin() {
  els.adminLoginView.hidden = false;
  els.adminDashboardView.hidden = true;
}

function showDashboard(user) {
  els.adminLoginView.hidden = true;
  els.adminDashboardView.hidden = false;
  els.adminUserLabel.textContent = user?.email || "Administrador";
}

function stopAdminListeners() {
  if (stopRsvps) stopRsvps();
  if (stopQuestions) stopQuestions();
  stopRsvps = null;
  stopQuestions = null;
  currentRsvps = [];
  currentQuestions = [];
  renderDashboard();
}

function startAdminListeners() {
  if (!db || stopRsvps || stopQuestions) return;
  const rsvpQuery = query(collection(db, "rsvps"), orderBy("createdAt", "desc"));
  const questionQuery = query(collection(db, "questions"), orderBy("createdAt", "desc"));

  stopRsvps = onSnapshot(rsvpQuery, (snapshot) => {
    currentRsvps = snapshot.docs.map((snap) => ({ id: snap.id, ...snap.data() }));
    renderDashboard();
  }, (error) => {
    console.error(error);
    showToast("Erro ao ler confirmações.");
  });

  stopQuestions = onSnapshot(questionQuery, (snapshot) => {
    currentQuestions = snapshot.docs.map((snap) => ({ id: snap.id, ...snap.data() }));
    renderDashboard();
  }, (error) => {
    console.error(error);
    showToast("Erro ao ler dúvidas.");
  });
}

function formatDate(ts) {
  if (!ts?.toDate) return "agora";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit"
  }).format(ts.toDate());
}

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[ch]));
}

function renderDashboard() {
  const totalPeople = currentRsvps.reduce((sum, item) => sum + (Number(item.guests) || 0), 0);
  const pending = currentQuestions.filter((item) => item.status !== "resolved").length;

  els.statRsvps.textContent = String(currentRsvps.length);
  els.statPeople.textContent = String(totalPeople);
  els.statQuestions.textContent = String(currentQuestions.length);
  els.statPending.textContent = String(pending);

  renderRsvps();
  renderQuestions();
}

function renderRsvps() {
  const term = els.rsvpSearch.value.trim().toLowerCase();
  const rows = currentRsvps.filter((item) => !term || String(item.name || "").toLowerCase().includes(term));

  if (!rows.length) {
    els.rsvpTableBody.innerHTML = '<tr><td colspan="5" class="empty">Nenhuma confirmação encontrada.</td></tr>';
    return;
  }

  els.rsvpTableBody.innerHTML = rows.map((item) => `
    <tr>
      <td><strong>${esc(item.name)}</strong></td>
      <td>${esc(item.guests || 1)}</td>
      <td>${item.note ? esc(item.note) : '<span class="empty">—</span>'}</td>
      <td>${esc(formatDate(item.createdAt))}</td>
      <td>
        <div class="table-actions">
          <button class="row-action edit" type="button" data-edit-rsvp="${esc(item.id)}">Editar</button>
          <button class="row-action delete" type="button" data-delete-rsvp="${esc(item.id)}">Apagar</button>
        </div>
      </td>
    </tr>
  `).join("");

  els.rsvpTableBody.querySelectorAll("[data-edit-rsvp]").forEach((button) => {
    button.addEventListener("click", () => openGuestEditor(button.dataset.editRsvp));
  });

  els.rsvpTableBody.querySelectorAll("[data-delete-rsvp]").forEach((button) => {
    button.addEventListener("click", () => deleteGuest(button.dataset.deleteRsvp, button));
  });
}


function openGuestEditor(id) {
  const item = currentRsvps.find((row) => row.id === id);
  if (!item) {
    showToast("Confirmação não encontrada.");
    return;
  }

  els.guestEditId.value = id;
  els.guestEditName.value = item.name || "";
  els.guestEditGuests.value = String(Number(item.guests) || 1);
  els.guestEditNote.value = item.note || "";
  setStatus(els.guestEditorStatus, "");

  if (typeof els.guestEditorDialog.showModal === "function") {
    if (!els.guestEditorDialog.open) els.guestEditorDialog.showModal();
  } else {
    els.guestEditorDialog.setAttribute("open", "");
  }
}

function closeGuestEditor() {
  if (typeof els.guestEditorDialog.close === "function") els.guestEditorDialog.close();
  else els.guestEditorDialog.removeAttribute("open");
}

els.guestEditorClose.addEventListener("click", closeGuestEditor);
els.guestEditorCancel.addEventListener("click", closeGuestEditor);
els.guestEditorDialog.addEventListener("click", (event) => {
  if (event.target === els.guestEditorDialog) closeGuestEditor();
});

els.guestEditorForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!db || !auth?.currentUser) {
    setStatus(els.guestEditorStatus, "Sessão administrativa não encontrada.", "error");
    return;
  }

  const id = els.guestEditId.value;
  const name = els.guestEditName.value.trim().replace(/\s+/g, " ");
  const guests = Number.parseInt(els.guestEditGuests.value, 10);
  const note = els.guestEditNote.value.trim();

  if (name.length < 2) {
    els.guestEditName.focus();
    setStatus(els.guestEditorStatus, "Digite um nome válido.", "error");
    return;
  }

  if (!Number.isInteger(guests) || guests < 1 || guests > 8) {
    setStatus(els.guestEditorStatus, "Quantidade inválida.", "error");
    return;
  }

  els.guestEditorSave.disabled = true;
  setStatus(els.guestEditorStatus, "Salvando...");
  try {
    await updateDoc(doc(db, "rsvps", id), {
      name,
      guests,
      note: note.slice(0, 240)
    });
    setStatus(els.guestEditorStatus, "Alterações salvas.", "success");
    showToast("Convidado atualizado. ✅");
    setTimeout(closeGuestEditor, 350);
  } catch (error) {
    console.error(error);
    setStatus(els.guestEditorStatus, "Não foi possível salvar.", "error");
  } finally {
    els.guestEditorSave.disabled = false;
  }
});

async function deleteGuest(id, button) {
  const item = currentRsvps.find((row) => row.id === id);
  if (!item || !db || !auth?.currentUser) return;

  const confirmed = window.confirm(
    `Apagar a confirmação de "${item.name}"?\n\nEssa ação remove o registro do banco de dados.`
  );
  if (!confirmed) return;

  button.disabled = true;
  try {
    await deleteDoc(doc(db, "rsvps", id));
    showToast("Confirmação apagada.");
  } catch (error) {
    console.error(error);
    showToast("Não foi possível apagar a confirmação.");
    button.disabled = false;
  }
}

function renderQuestions() {
  const filter = els.questionFilter.value;
  const rows = currentQuestions.filter((item) => {
    const resolved = item.status === "resolved";
    if (filter === "pending") return !resolved;
    if (filter === "resolved") return resolved;
    return true;
  });

  if (!rows.length) {
    els.questionList.innerHTML = '<p class="empty">Nenhuma dúvida encontrada.</p>';
    return;
  }

  els.questionList.innerHTML = rows.map((item) => {
    const resolved = item.status === "resolved";
    return `
      <article class="admin-question ${resolved ? "resolved" : ""}">
        <div class="question-top">
          <div>
            <span class="question-topic">${esc(item.topic || "Outro")}</span>
            <strong>${esc(item.name)}</strong>
            <small>${esc(formatDate(item.createdAt))}</small>
          </div>
          <button class="resolve-button" type="button" data-question-id="${esc(item.id)}" data-next-status="${resolved ? "pending" : "resolved"}">
            ${resolved ? "Reabrir" : "Marcar resolvida"}
          </button>
        </div>
        <p>${esc(item.message)}</p>
      </article>
    `;
  }).join("");

  els.questionList.querySelectorAll("[data-question-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!db) return;
      button.disabled = true;
      try {
        await updateDoc(doc(db, "questions", button.dataset.questionId), {
          status: button.dataset.nextStatus
        });
      } catch (error) {
        console.error(error);
        showToast("Não foi possível atualizar a dúvida.");
      } finally {
        button.disabled = false;
      }
    });
  });
}

els.rsvpSearch.addEventListener("input", renderRsvps);
els.questionFilter.addEventListener("change", renderQuestions);

els.exportCsv.addEventListener("click", () => {
  const rows = [
    ["tipo","nome","pessoas","assunto","mensagem/recado","status","data"],
    ...currentRsvps.map((item) => [
      "confirmacao", item.name || "", item.guests || 1, "", item.note || "", "", formatDate(item.createdAt)
    ]),
    ...currentQuestions.map((item) => [
      "duvida", item.name || "", "", item.topic || "", item.message || "", item.status || "pending", formatDate(item.createdAt)
    ])
  ];

  const csv = rows.map((row) => row.map((value) => {
    const text = String(value ?? "").replace(/"/g, '""');
    return `"${text}"`;
  }).join(";")).join("\n");

  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "aniversario-otto-confirmacoes-e-duvidas.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});

if (localStorage.getItem("otto-rsvp-sent") === "1") {
  setStatus(els.rsvpStatus, "Este aparelho já enviou uma confirmação anteriormente.", "success");
}
