import { firebaseConfig, ADMIN_AUTH_EMAIL } from "./firebase-config.js";

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
  getFirestore, collection, addDoc, serverTimestamp, onSnapshot,
  query, orderBy, doc, updateDoc
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
    els.rsvpTableBody.innerHTML = '<tr><td colspan="4" class="empty">Nenhuma confirmação encontrada.</td></tr>';
    return;
  }

  els.rsvpTableBody.innerHTML = rows.map((item) => `
    <tr>
      <td><strong>${esc(item.name)}</strong></td>
      <td>${esc(item.guests || 1)}</td>
      <td>${item.note ? esc(item.note) : '<span class="empty">—</span>'}</td>
      <td>${esc(formatDate(item.createdAt))}</td>
    </tr>
  `).join("");
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
