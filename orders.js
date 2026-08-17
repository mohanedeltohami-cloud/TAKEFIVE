/* ════════════════════════════════════════════════════════════════
   Take Five — orders.js
   ONLY responsibility: Accept Order → checkout → WhatsApp.
   Delivery-only flow.
   Reads/writes the shared window.Cart from script.js.
════════════════════════════════════════════════════════════════ */

const WHATSAPP_NUMBER = "201040536027"; // single source of truth for the order number

function openCheckout() {
  if (!window.Cart || Cart.count() === 0) return;
  closeCart();
  $("#customerFormError").hidden = true;
  renderCustomerForm();
  goToStep("customerInfo");
  $("#checkoutModal").classList.add("open");
  document.body.classList.add("no-scroll");
}

function closeCheckout() {
  $("#checkoutModal").classList.remove("open");
  document.body.classList.remove("no-scroll");
}

function goToStep(step) {
  $$(".checkout-step").forEach(s => { s.hidden = s.dataset.step !== step; });
}

function renderCustomerForm() {
  $("#customerFields").innerHTML = `
    <div class="field">
      <label for="custName">الاسم بالكامل</label>
      <input id="custName" type="text" autocomplete="name" placeholder="اكتب اسمك">
    </div>
    <div class="field">
      <label for="custPhone">رقم الموبايل</label>
      <input id="custPhone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="01XXXXXXXXX">
    </div>
    <div class="field">
      <label for="custAddress">العنوان بالتفصيل</label>
      <textarea id="custAddress" rows="3" placeholder="الحي، الشارع، رقم العمارة، علامة مميزة..."></textarea>
    </div>`;
}

function validateCustomerForm() {
  const name = $("#custName")?.value.trim();
  const phone = $("#custPhone")?.value.trim();
  const address = $("#custAddress")?.value.trim();
  if (!name || !phone) return "من فضلك املأ الاسم ورقم الموبايل";
  if (!address) return "من فضلك أدخل العنوان بالتفصيل";
  return null;
}

function buildReview() {
  const name = $("#custName").value.trim();
  const phone = $("#custPhone").value.trim();
  const address = $("#custAddress").value.trim();

  $("#reviewDetails").innerHTML = [
    ["الاسم", name],
    ["رقم الموبايل", phone],
    ["العنوان", address]
  ].map(([k, v]) => `<div class="review-row"><span>${k}</span><strong>${esc(v)}</strong></div>`).join("");

  $("#reviewItems").innerHTML = Cart.items.map(i => `
    <li><span>${esc(i.name)} × ${i.qty}</span><span>${fmt(i.price * i.qty)}</span></li>
  `).join("");

  $("#reviewTotal").textContent = fmt(Cart.total());

  return { name, phone, address };
}

function sendToWhatsApp(details) {
  const lines = [
    "Take Five - New Order", "",
    "Customer:", details.name, "",
    "Phone:", details.phone, "",
    "Address:", details.address, "",
    "Items:",
    ...Cart.items.map(i => `${i.name} x ${i.qty} — ${i.qty * i.price} EGP`),
    "",
    "Total:", `${Cart.total()} EGP`
  ];

  const message = encodeURIComponent(lines.join("\n"));
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");

  Cart.clear();
  closeCheckout();
}

document.addEventListener("DOMContentLoaded", () => {
  $("#acceptOrderBtn")?.addEventListener("click", openCheckout);
  $("#closeCheckoutBtn")?.addEventListener("click", closeCheckout);
  $("#checkoutModal")?.addEventListener("click", e => { if (e.target.id === "checkoutModal") closeCheckout(); });

  $("#backToInfoBtn")?.addEventListener("click", () => goToStep("customerInfo"));

  $("#toReviewBtn")?.addEventListener("click", () => {
    const error = validateCustomerForm();
    const errEl = $("#customerFormError");
    if (error) { errEl.textContent = error; errEl.hidden = false; return; }
    errEl.hidden = true;

    const details = buildReview();
    goToStep("review");
    $("#sendWhatsAppBtn").onclick = () => sendToWhatsApp(details);
  });
});

