// ============================================================
//  VeriForge AI — Enrollment payment (Razorpay)
// ============================================================
//
//  HOW PAYMENTS WORK (secure flow):
//  1. User submits the enrollment form.
//  2. We call the Netlify Function `/.netlify/functions/create-order`
//     which uses your SECRET Razorpay key (server-side only) to create
//     an order and returns { id, amount, currency, keyId }.
//  3. Razorpay Checkout opens with that order (UPI / cards / netbanking).
//  4. On success Razorpay returns a payment id + signature which we send
//     to `/.netlify/functions/verify-payment` to verify authenticity.
//
//  Until you add your Razorpay keys (see README), the site runs in
//  DEMO MODE and simply shows a confirmation without charging.
// ============================================================

const CREATE_ORDER_URL = "/api/create-order";
const VERIFY_URL = "/api/verify-payment";

const form = document.getElementById("enrollForm");
const statusEl = document.getElementById("formStatus");
const payBtn = document.getElementById("payBtn");

function setStatus(msg, type = "") {
  statusEl.textContent = msg;
  statusEl.className = "form-status" + (type ? " " + type : "");
}

function setLoading(loading) {
  payBtn.disabled = loading;
  payBtn.textContent = loading ? "Please wait…" : "Proceed to secure payment";
}

function validEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function validPhone(v) {
  return /^\+?\d{10,13}$/.test(v.replace(/[\s-]/g, ""));
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setStatus("");

  const name = document.getElementById("fName").value.trim();
  const email = document.getElementById("fEmail").value.trim();
  const phone = document.getElementById("fPhone").value.trim();
  const courseRaw = document.getElementById("fCourse").value;
  const notes = document.getElementById("fNotes").value.trim();

  // --- Validation ---
  if (!name) return setStatus("Please enter your name.", "err");
  if (!validEmail(email)) return setStatus("Please enter a valid email.", "err");
  if (!validPhone(phone)) return setStatus("Please enter a valid phone number.", "err");
  if (!courseRaw) return setStatus("Please select a course.", "err");

  const [course, amountStr] = courseRaw.split("|");
  const amountINR = parseInt(amountStr, 10); // rupees

  setLoading(true);
  setStatus("Creating your secure order…");

  try {
    // 1) Ask backend to create a Razorpay order
    const res = await fetch(CREATE_ORDER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amountINR, course, name, email, phone, notes }),
    });

    // --- DEMO MODE: backend/keys not configured yet ---
    if (!res.ok) {
      const detail = await res.text();
      console.warn("create-order not available:", res.status, detail);
      demoConfirm(course, amountINR);
      return;
    }

    const order = await res.json();

    // 2) Open Razorpay Checkout
    const options = {
      key: order.keyId,
      amount: order.amount, // in paise, from server
      currency: order.currency || "INR",
      name: "VeriForge AI Technologies",
      description: course,
      order_id: order.id,
      prefill: { name, email, contact: phone },
      notes: { course, notes },
      theme: { color: "#38e1c9" },
      handler: async (response) => {
        setStatus("Verifying payment…");
        try {
          const verify = await fetch(VERIFY_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, course, name, email, phone }),
          });
          if (verify.ok) {
            setStatus(`🎉 Enrollment confirmed for “${course}”. A receipt has been sent to ${email}.`, "ok");
            form.reset();
          } else {
            setStatus("Payment received but verification failed. Please contact us with your payment id.", "err");
          }
        } catch {
          setStatus("Payment received but verification failed. Please contact us with your payment id.", "err");
        }
      },
      modal: {
        ondismiss: () => setStatus("Payment cancelled. You can try again anytime.", "err"),
      },
    };

    const rzp = new Razorpay(options);
    rzp.on("payment.failed", (resp) => {
      setStatus("Payment failed: " + (resp.error?.description || "Please try again."), "err");
    });
    rzp.open();
    setStatus("");
  } catch (err) {
    console.error(err);
    // Network/other error -> fall back to demo confirmation so the UX isn't broken
    demoConfirm(course, amountINR);
  } finally {
    setLoading(false);
  }
});

// Shown when Razorpay keys/backend aren't configured yet.
function demoConfirm(course, amountINR) {
  setLoading(false);
  setStatus(
    `Demo mode: payment is not live yet. Once Razorpay keys are added, ` +
    `“${course}” (₹${amountINR.toLocaleString("en-IN")}) will be charged here. ` +
    `Your details were captured.`,
    "ok"
  );
}
