// ============================================================
//  VeriForge AI — FAQ chat assistant
//  Answers common questions locally (no external AI/cost) and,
//  for anything it can't answer, captures the visitor's email +
//  question and emails it to the team.
// ============================================================

// --- Email delivery config -------------------------------------------------
// Get a free access key at https://web3forms.com (enter chiragkedia@gmail.com).
// Paste it below to have questions delivered silently to your inbox.
// Until then, the bot falls back to opening the visitor's email client (mailto).
const WEB3FORMS_ACCESS_KEY = "cc8c5f63-a3c7-41bd-b98f-e78224653a2d";        // e.g. "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
const TEAM_EMAIL = "chiragkedia@gmail.com";
// ---------------------------------------------------------------------------

(() => {
const widget = document.getElementById("chatWidget");
const toggle = document.getElementById("chatToggle");
const panel = document.getElementById("chatPanel");
const closeBtn = document.getElementById("chatClose");
const body = document.getElementById("chatBody");
const quick = document.getElementById("chatQuick");
const form = document.getElementById("chatForm");
const input = document.getElementById("chatInput");

let greeted = false;

// ---- Knowledge base -------------------------------------------------------
const KB = [
  {
    id: "courses",
    keywords: ["course", "courses", "class", "classes", "training", "program", "learn", "vlsi", "syllabus", "curriculum"],
    answer:
      "We offer three premium, instructor-led programs (AI woven into each):<br><br>" +
      "• <strong>VLSI Fundamentals</strong> — 4 weeks — ₹50,000<br>" +
      "• <strong>Design Verification (UVM)</strong> — 6 weeks — ₹50,000<br>" +
      "• <strong>AI in Design Verification</strong> — 4 weeks — ₹35,000<br><br>" +
      'You can <a href="#courses">view the courses</a> or <a href="#enroll">enroll here</a>.',
    chips: ["How to enroll?", "Payment options", "Fees"],
  },
  {
    id: "fees",
    keywords: ["fee", "fees", "price", "cost", "charge", "how much", "amount", "rupees", "money"],
    answer:
      "Course fees:<br>• VLSI Fundamentals — <strong>₹50,000</strong> (4 weeks)<br>" +
      "• Design Verification (UVM) — <strong>₹50,000</strong> (6 weeks)<br>" +
      "• AI in Design Verification — <strong>₹35,000</strong> (4 weeks)",
    chips: ["How to enroll?", "Refund policy", "Payment options"],
  },
  {
    id: "enroll",
    keywords: ["enroll", "enrol", "join", "register", "registration", "admission", "sign up", "signup", "book", "seat"],
    answer:
      'To enroll: open the <a href="#enroll">Enroll section</a>, fill your details, pick a course, and pay securely online. ' +
      "Your seat is confirmed once payment succeeds.",
    chips: ["Payment options", "Fees", "Refund policy"],
  },
  {
    id: "payment",
    keywords: ["pay", "payment", "upi", "card", "credit", "debit", "netbanking", "net banking", "razorpay", "gpay", "phonepe"],
    answer:
      "Payments are handled securely by <strong>Razorpay</strong>. You can pay via <strong>UPI, credit card, debit card, or net banking</strong>. " +
      "We never store your card or UPI details.",
    chips: ["How to enroll?", "Refund policy"],
  },
  {
    id: "refund",
    keywords: ["refund", "cancel", "cancellation", "money back", "return"],
    answer:
      "Full refund if you cancel <strong>7+ days before</strong> the batch starts. After the batch begins, fees are non-refundable. " +
      'Full details: <a href="refund.html">Refund &amp; Cancellation Policy</a>.',
    chips: ["Talk to the team"],
  },
  {
    id: "services",
    keywords: ["service", "services", "verification", "verify", "ip", "soc", "subsystem", "ss", "uvm", "coverage", "testbench", "consulting", "offer"],
    answer:
      "We provide <strong>AI-driven functional verification</strong> for <strong>IP, Subsystem (SS) and SoC</strong> designs — " +
      "UVM environments, assertion-based verification, coverage closure, AI-assisted stimulus & regression triage, plus training. " +
      'See <a href="#services">Services</a> and <a href="#verification">AI Verification</a>.',
    chips: ["Courses", "Talk to the team"],
  },
  {
    id: "about",
    keywords: ["about", "team", "founder", "who are you", "who is", "chirag", "navneet", "company", "experience"],
    answer:
      "VeriForge AI Technologies is led by <strong>Chirag Kedia</strong> (Founder &amp; Verification Lead) and " +
      "<strong>Navneet Goel</strong> (Co-Founder &amp; VLSI Lead) — semiconductor verification engineers combining DV/VLSI expertise with AI. " +
      'More on the <a href="#about">About section</a>.',
    chips: ["Services", "Courses"],
  },
  {
    id: "contact",
    keywords: ["contact", "email", "phone", "call", "reach", "mobile", "number", "whatsapp", "address", "location", "where"],
    answer:
      'Reach us at <a href="mailto:chiragkedia@gmail.com">chiragkedia@gmail.com</a> or ' +
      '<a href="tel:+918010462173">+91-8010462173</a>.<br>' +
      "📍 Sector CHI 5, Greater Noida, Uttar Pradesh - 201310, India.",
    chips: ["Talk to the team", "Courses"],
  },
  {
    id: "duration",
    keywords: ["duration", "how long", "weeks", "schedule", "timing", "batch", "start"],
    answer:
      "Durations: VLSI Fundamentals — <strong>4 weeks</strong>; Design Verification (UVM) — <strong>6 weeks</strong>; " +
      "AI in Design Verification — <strong>4 weeks</strong>. For batch timings, ask the team.",
    chips: ["Talk to the team", "Fees"],
  },
  {
    id: "greeting",
    keywords: ["hi", "hello", "hey", "namaste", "good morning", "good evening", "hii"],
    answer: "Hello! 👋 I'm the VeriForge assistant. Ask me about our courses, fees, verification services, or enrollment.",
    chips: ["Courses", "Services", "How to enroll?"],
  },
  {
    id: "thanks",
    keywords: ["thanks", "thank", "thanks", "great", "cool", "ok", "okay", "got it"],
    answer: "You're welcome! Anything else I can help with?",
    chips: ["Courses", "Talk to the team"],
  },
];

const DEFAULT_CHIPS = ["Courses", "Fees", "Services", "How to enroll?", "Talk to the team"];

// ---- UI helpers -----------------------------------------------------------
function scrollDown() { body.scrollTop = body.scrollHeight; }

function addMessage(html, who = "bot") {
  const el = document.createElement("div");
  el.className = "chat-msg " + who;
  el.innerHTML = html;
  body.appendChild(el);
  scrollDown();
  return el;
}

function showTyping() {
  const t = document.createElement("div");
  t.className = "chat-typing";
  t.innerHTML = "<span></span><span></span><span></span>";
  body.appendChild(t);
  scrollDown();
  return t;
}

function renderChips(list) {
  quick.innerHTML = "";
  (list || DEFAULT_CHIPS).forEach((label) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chat-chip";
    chip.textContent = label;
    chip.addEventListener("click", () => handleUser(label));
    quick.appendChild(chip);
  });
}

function botSay(html, chips, delay = 550) {
  const typing = showTyping();
  setTimeout(() => {
    typing.remove();
    addMessage(html, "bot");
    renderChips(chips);
  }, delay);
}

// ---- Intent matching ------------------------------------------------------
function findIntent(text) {
  const q = text.toLowerCase();
  if (/talk|team|human|agent|contact.*(team|you)|ask.*(team|question)|raise|support|help me/.test(q)) return "escalate";
  let best = null, bestScore = 0;
  for (const item of KB) {
    let score = 0;
    for (const kw of item.keywords) if (q.includes(kw)) score += kw.length;
    if (score > bestScore) { bestScore = score; best = item; }
  }
  return bestScore > 0 ? best : null;
}

// ---- Escalation (email the team) ------------------------------------------
function startEscalation(prefill) {
  const typing = showTyping();
  setTimeout(() => {
    typing.remove();
    const wrap = addMessage(
      "Sure — leave your question and email, and our team will get back to you.",
      "bot"
    );
    const box = document.createElement("div");
    box.className = "chat-inline";
    box.innerHTML =
      '<input type="email" id="escEmail" placeholder="Your email" />' +
      '<textarea id="escMsg" rows="3" placeholder="Your question…"></textarea>' +
      '<button type="button" id="escSend">Send to team</button>';
    wrap.appendChild(box);
    if (prefill) box.querySelector("#escMsg").value = prefill;
    renderChips([]);
    box.querySelector("#escSend").addEventListener("click", submitEscalation);
    scrollDown();
  }, 500);
}

async function submitEscalation() {
  const email = document.getElementById("escEmail");
  const msg = document.getElementById("escMsg");
  const emailVal = email.value.trim();
  const msgVal = msg.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) { email.focus(); return; }
  if (!msgVal) { msg.focus(); return; }

  addMessage("📨 " + msgVal, "user");
  const sendBtn = document.getElementById("escSend");
  if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = "Sending…"; }

  const ok = await sendToTeam(emailVal, msgVal);
  if (ok) {
    botSay("✅ Thanks! Your question has been sent to our team. We'll reply to <strong>" + emailVal + "</strong> soon.", DEFAULT_CHIPS);
  } else {
    // Fallback: open the visitor's email client pre-filled.
    const subject = encodeURIComponent("Query from VeriForge AI website");
    const bodyTxt = encodeURIComponent(`From: ${emailVal}\n\n${msgVal}`);
    botSay(
      'I couldn\'t send it automatically. Please email us directly: ' +
      `<a href="mailto:${TEAM_EMAIL}?subject=${subject}&body=${bodyTxt}">${TEAM_EMAIL}</a>.`,
      DEFAULT_CHIPS
    );
  }
}

async function sendToTeam(fromEmail, message) {
  if (!WEB3FORMS_ACCESS_KEY) return false; // not configured → use mailto fallback
  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: "New query from VeriForge AI website",
        from_name: "VeriForge Website Chatbot",
        email: fromEmail,
        message: message,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ---- Main handler ---------------------------------------------------------
function handleUser(text) {
  const clean = text.trim();
  if (!clean) return;
  addMessage(clean, "user");
  input.value = "";

  const intent = findIntent(clean);
  if (intent === "escalate") { startEscalation(); return; }
  if (intent) { botSay(intent.answer, intent.chips); return; }

  // Unknown → offer to forward to the team, prefilled with their question.
  botSay(
    "I'm not sure about that one. I can send your question to our team so they can help directly.",
    []
  );
  setTimeout(() => startEscalation(clean), 700);
}

// ---- Wiring ---------------------------------------------------------------
function openChat() {
  panel.hidden = false;
  widget.classList.add("open");
  if (!greeted) {
    greeted = true;
    botSay(
      "Hi! 👋 I'm the <strong>VeriForge Assistant</strong>. Ask me about our courses, fees, AI verification services, or how to enroll.",
      DEFAULT_CHIPS,
      300
    );
  }
  setTimeout(() => input.focus(), 250);
}
function closeChat() { panel.hidden = true; widget.classList.remove("open"); }

toggle.addEventListener("click", () => (panel.hidden ? openChat() : closeChat()));
closeBtn.addEventListener("click", closeChat);
form.addEventListener("submit", (e) => { e.preventDefault(); handleUser(input.value); });
})();
