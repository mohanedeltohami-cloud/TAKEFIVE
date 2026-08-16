/* ════════════════════════════════════════════════════════════════
   Take Five — api.js
   ONLY responsibility: talking to Google Sheets.
   ────────────────────────────────────────────────────────────────
   Expected Google Sheet columns:
   ID | Product Name | Price | Description | Category | Image URL | Featured | Availability

   To go live: paste your Apps Script Web App URL below.
   Until then, the menu runs on the built-in demo data.
════════════════════════════════════════════════════════════════ */

const API_URL = ""; // e.g. "https://script.google.com/macros/s/XXXX/exec"

/* One demo product per category — replace by filling the Sheet. */
const DEMO_PRODUCTS = [
  { id: 1, name: "برجر تشيكن",   price: 120, description: "برجر فراخ مقرمش مع جبنة تشيدر وصوص البيت", category: "ساندوتش",   image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80&auto=format&fit=crop", featured: true,  available: true },
  { id: 2, name: "وجبة فراخ",    price: 150, description: "صدور فراخ مشوية مع أرز، بطاطس، وسلطة جانبية", category: "وجبات",      image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&q=80&auto=format&fit=crop", featured: false, available: true },
  { id: 3, name: "بطاطس",        price: 45,  description: "بطاطس مقرمشة طازة تُقلى عند الطلب",           category: "إضافات",     image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&q=80&auto=format&fit=crop", featured: false, available: true },
  { id: 4, name: "ريزو تشيكن",   price: 130, description: "أرز بالفراخ والخضار على الطريقة المصرية",     category: "ريزو",       image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80&auto=format&fit=crop", featured: false, available: true },
  { id: 5, name: "شاورما فراخ",  price: 120, description: "شاورما فراخ بالخبز البلدي والصوص الخاص",       category: "شاورما",     image: "https://images.unsplash.com/photo-1633321088355-d0f81134ca3b?w=800&q=80&auto=format&fit=crop", featured: true,  available: true },
  { id: 6, name: "مكرونة كريمي", price: 125, description: "مكرونة بصوص الكريمة والفراخ والمشروم",        category: "مكرونة",     image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=800&q=80&auto=format&fit=crop", featured: false, available: true },
  { id: 7, name: "سلطة",         price: 40,  description: "خضار طازة مقرمشة مع تتبيلة خفيفة",             category: "سلطة",       image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80&auto=format&fit=crop", featured: false, available: true },
  { id: 8, name: "حلو برمو",     price: 50,  description: "حلو بارد بطبقات البسكويت والشوكولاتة",         category: "حلو برمو",   image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=800&q=80&auto=format&fit=crop", featured: false, available: true },
  { id: 9, name: "بيبسي",        price: 25,  description: "مشروب غازي بارد 330 مل",                       category: "مشروبات",    image: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=800&q=80&auto=format&fit=crop", featured: false, available: true }
];

/* Normalizes one raw Sheet row into the shape the site uses,
   tolerant of exact header spelling/case.                        */
function mapSheetRow(row, i) {
  const get = (...keys) => {
    for (const k of keys) if (row[k] !== undefined && row[k] !== "") return row[k];
    return undefined;
  };
  const availabilityRaw = get("Availability", "availability");
  return {
    id: Number(get("ID", "id")) || i + 1,
    name: String(get("Product Name", "product name", "Name", "name") || "").trim(),
    price: Number(get("Price", "price")) || 0,
    description: String(get("Description", "description") || "").trim(),
    category: String(get("Category", "category") || "").trim(),
    image: String(get("Image URL", "image url", "Image", "image") || "").trim(),
    featured: /true|yes|1/i.test(String(get("Featured", "featured") || "")),
    available: availabilityRaw === undefined
      ? true
      : !/false|no|0|غير متوفر|unavailable/i.test(String(availabilityRaw))
  };
}

/* Fetches the live menu from the Sheet, or returns the demo menu
   when no API_URL has been configured yet.                       */
async function fetchMenu() {
  if (!API_URL) return DEMO_PRODUCTS;

  const res = await fetch(API_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("Sheet request failed");
  const rows = await res.json();
  const products = rows.map(mapSheetRow).filter(p => p.name);
  return products.length ? products : DEMO_PRODUCTS;
}