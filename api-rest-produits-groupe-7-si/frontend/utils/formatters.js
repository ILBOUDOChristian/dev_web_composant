export function formatPrice(value) {
  const num = Math.round(Number(value) || 0);
  return `${num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} XOF`;
}

export function getStockStatus(stock) {
  const qty = Number(stock) || 0;
  if (qty === 0) {
    return { label: "Rupture", className: "status-rupture", key: "out_of_stock" };
  }
  if (qty < 10) {
    return { label: "Stock faible", className: "status-faible", key: "low_stock" };
  }
  return { label: "En stock", className: "status-en-stock", key: "in_stock" };
}

export function getCategoryBadge(category, name = "") {
  const text = (String(category || "") + " " + String(name || "")).toLowerCase();

  if (text.includes("périphérique") || text.includes("peripherique") || text.includes("souris") || text.includes("clavier")) {
    return { name: "Périphériques", className: "cat-blue", key: "peripheriques" };
  }
  if (text.includes("écran") || text.includes("ecran") || text.includes("moniteur") || text.includes("screen")) {
    return { name: "Écrans", className: "cat-purple", key: "ecrans" };
  }
  if (text.includes("accessoire") || text.includes("support") || text.includes("disque") || text.includes("cable")) {
    return { name: "Accessoires", className: "cat-gray", key: "accessoires" };
  }

  return { name: category || "Accessoires", className: "cat-gray", key: "accessoires" };
}
