/* ════════════════════════════════════════════════════════════════
   Take Five — script.js
   Menu rendering + categories accordion + cart.
   (Ordering/checkout logic lives in orders.js)
════════════════════════════════════════════════════════════════ */

const CATEGORY_ORDER = ["ساندوتش", "وجبات", "إضافات", "ريزو", "شاورما", "مكرونة", "سلطة", "حلو برمو", "مشروبات"];

const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23F5F5F5'/%3E%3Ccircle cx='100' cy='86' r='34' fill='none' stroke='%231A1A1A' stroke-width='4'/%3E%3Cpath d='M58 148h84' stroke='%23FFB21C' stroke-width='6' stroke-linecap='round'/%3E%3C/svg%3E";

let MENU = [];

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const fmt = n => `${Number(n).toLocaleString("en-US")} EGP`;

/* ── Cart (shared with orders.js via window.Cart) ─────────────── */
const Cart = {
  items: [], // { id, name, price, qty }

  add(product) {
    const existing = this.items.find(i => i.id === product.id);
    if (existing) existing.qty += 1;
    else this.items.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
    this._pulse();
    renderCart();
  },
  setQty(id, qty) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;
    if (qty <= 0) this.items = this.items.filter(i => i.id !== id);
    else item.qty = qty;
    renderCart();
  },
  remove(id) { this.items = this.items.filter(i => i.id !== id); renderCart(); },
  count() { return this.items.reduce((s, i) => s + i.qty, 0); },
  total() { return this.items.reduce((s, i) => s + i.qty * i.price, 0); },
  clear() { this.items = []; renderCart(); },
  _pulse() {
    const bar = $("#cartBar");
    if (!bar) return;
    bar.classList.remove("pulse");
    void bar.offsetWidth;
    bar.classList.add("pulse");
  }
};
window.Cart = Cart;

function guardImages(root) {
  $$("img[data-fallback]", root).forEach(img => {
    img.addEventListener("error", () => { img.src = FALLBACK_IMG; }, { once: true });
  });
}

/* ── Menu rendering ───────────────────────────────────────────── */
function productCardHTML(p) {
  return `
    <li class="product-card${p.available ? "" : " is-unavailable"}">
      <img class="product-img" src="${p.image || FALLBACK_IMG}" alt="${esc(p.name)}" data-fallback loading="lazy">
      <div class="product-body">
        <div class="product-head">
          <h4 class="product-name">${esc(p.name)}</h4>
          ${p.featured ? `<span class="badge-featured">الأكثر طلبًا</span>` : ""}
        </div>
        ${p.description ? `<p class="product-desc">${esc(p.description)}</p>` : ""}
        <div class="product-foot">
          ${p.available
            ? `<span class="product-price">${fmt(p.price)}</span>
               <button class="add-btn" type="button" data-add="${p.id}" aria-label="أضف ${esc(p.name)}">+</button>`
            : `<span class="unavailable-label">غير متوفر</span>`}
        </div>
      </div>
    </li>`;
}

function categoryCardHTML(cat, products) {
  return `
    <div class="category-card">
      <button class="category-head" type="button" aria-expanded="false">
        <span>${esc(cat)}</span>
        <span class="toggle-icon" aria-hidden="true">+</span>
      </button>
      <div class="category-panel">
        <div class="category-panel-inner">
          <ul class="product-list">${products.map(productCardHTML).join("")}</ul>
        </div>
      </div>
    </div>`;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function renderMenu() {
  const grid = $("#categoriesGrid");
  const byCat = {};
  MENU.forEach(p => { (byCat[p.category] ||= []).push(p); });

  const cats = CATEGORY_ORDER.filter(c => byCat[c] && byCat[c].length);
  grid.innerHTML = cats.map(c => categoryCardHTML(c, byCat[c])).join("");

  guardImages(grid);
  bindAccordion();
  bindAddButtons();
}

function bindAccordion() {
  $$(".category-head").forEach(head => {
    head.addEventListener("click", () => {
      const card = head.closest(".category-card");
      const wasOpen = card.classList.contains("open");

      $$(".category-card.open").forEach(c => {
        c.classList.remove("open");
        $(".category-head", c).setAttribute("aria-expanded", "false");
        $(".toggle-icon", c).textContent = "+";
      });

      if (!wasOpen) {
        card.classList.add("open");
        head.setAttribute("aria-expanded", "true");
        $(".toggle-icon", card).textContent = "−";
      }
    });
  });
}

function bindAddButtons() {
  $$("[data-add]").forEach(btn => {
    btn.addEventListener("click", () => {
      const product = MENU.find(p => p.id === Number(btn.dataset.add));
      if (product) Cart.add(product);
    });
  });
}

/* ── Cart UI ──────────────────────────────────────────────────── */
function renderCart() {
  const count = Cart.count();

  $("#cartCount").textContent = count;
  $("#cartTotal").textContent = fmt(Cart.total());
  $("#cartBar").hidden = count === 0;

  const list = $("#cartItems");
  list.innerHTML = Cart.items.map(i => `
    <li class="cart-item">
      <div class="cart-item-info">
        <p class="cart-item-name">${esc(i.name)}</p>
        <p class="cart-item-price">${fmt(i.price)}</p>
      </div>
      <div class="cart-item-actions">
        <button type="button" data-qty="${i.id}" data-step="-1" aria-label="تقليل الكمية">−</button>
        <span>${i.qty}</span>
        <button type="button" data-qty="${i.id}" data-step="1" aria-label="زيادة الكمية">+</button>
        <button type="button" class="remove-btn" data-remove="${i.id}" aria-label="إزالة">✕</button>
      </div>
    </li>`).join("");

  $$("[data-qty]", list).forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.qty);
      const item = Cart.items.find(i => i.id === id);
      if (item) Cart.setQty(id, item.qty + Number(btn.dataset.step));
    });
  });
  $$("[data-remove]", list).forEach(btn => {
    btn.addEventListener("click", () => Cart.remove(Number(btn.dataset.remove)));
  });

  $("#cartEmpty").hidden = count > 0;
  $("#acceptOrderBtn").disabled = count === 0;
  $("#cartItems").hidden = count === 0;
}

function openCart() { $("#cartModal").classList.add("open"); document.body.classList.add("no-scroll"); }
function closeCart() { $("#cartModal").classList.remove("open"); document.body.classList.remove("no-scroll"); }

/* ── Boot ─────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", async () => {
  $("#cartBar")?.addEventListener("click", openCart);
  $("#closeCartBtn")?.addEventListener("click", closeCart);
  $("#cartModal")?.addEventListener("click", e => { if (e.target.id === "cartModal") closeCart(); });

  const state = $("#menuState");
  state.hidden = false;
  state.textContent = "جاري تحميل المنيو...";

  try {
    MENU = await fetchMenu();
    state.hidden = true;
    renderMenu();
  } catch (err) {
    console.error("Menu load failed:", err);
    state.textContent = "تعذر تحميل المنيو حاليًا، برجاء المحاولة مرة أخرى.";
  }

  renderCart();
});
