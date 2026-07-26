// ===== Nav toggle (mobile) =====
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

navToggle?.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
});

// Close mobile menu when a link is clicked
navLinks?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
  });
});

// ===== Current year in footer =====
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ===== "Enroll" buttons on course cards -> scroll to form & preselect course =====
document.querySelectorAll(".enroll-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const course = btn.dataset.course;
    const amount = btn.dataset.amount;
    const select = document.getElementById("fCourse");
    if (select) select.value = `${course}|${amount}`;
    document.getElementById("enroll")?.scrollIntoView({ behavior: "smooth" });
    document.getElementById("fName")?.focus({ preventScroll: true });
  });
});
