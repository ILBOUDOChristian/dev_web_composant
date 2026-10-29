import { formatPrice, getStockStatus, getCategoryBadge } from '../utils/formatters.js';
import { escapeHtml } from '../utils/dom.js';

function getProductIconSvg(sku = '', name = '') {
  const combined = (sku + ' ' + name).toLowerCase();
  if (combined.includes('souris') || combined.includes('mouse')) {
    return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#64748b" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="7"></rect><line x1="12" y1="6" x2="12" y2="10"></line></svg>`;
  }
  if (combined.includes('écran') || combined.includes('ecran') || combined.includes('screen')) {
    return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#64748b" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`;
  }
  if (combined.includes('support') || combined.includes('laptop') || combined.includes('ordinateur') || combined.includes('disque')) {
    return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#64748b" stroke-width="2"><rect x="3" y="4" width="18" height="12" rx="2"></rect><path d="M2 20h20"></path></svg>`;
  }
  return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#64748b" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="6" y1="8" x2="6" y2="8"></line><line x1="10" y1="8" x2="10" y2="8"></line><line x1="14" y1="8" x2="14" y2="8"></line><line x1="18" y1="8" x2="18" y2="8"></line><line x1="6" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="18" y2="12"></line><line x1="8" y1="16" x2="16" y2="16"></line></svg>`;
}

export function ProductTable(products = [], onEdit, onDelete, onView, pagination = { page: 1, pageSize: 4 }, onPageChange, filterState = { searchQuery: '', selectedCategory: 'all', selectedStock: 'all' }) {
  const card = document.createElement('div');
  card.className = 'catalog-card';

  const total = products.length;
  const page = Math.max(1, pagination.page || 1);
  const pageSize = pagination.pageSize || 4;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);

  const startIdx = total === 0 ? 0 : (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);
  const pagedProducts = products.slice(startIdx, endIdx);

  const rows = pagedProducts.length ? pagedProducts.map(product => {
    const { label, className: statusClass } = getStockStatus(product.stock);
    const categoryInfo = getCategoryBadge(product.category, product.name);
    const iconSvg = getProductIconSvg(product.sku, product.name);

    return `
      <tr>
        <td>
          <div class="product-row-ref">
            <div class="product-thumb">
              ${iconSvg}
            </div>
            <span class="product-sku-code">${escapeHtml(product.sku)}</span>
          </div>
        </td>
        <td class="product-name-cell">${escapeHtml(product.name)}</td>
        <td>
          <span class="category-tag ${categoryInfo.className}">${escapeHtml(categoryInfo.name)}</span>
        </td>
        <td><span class="price-text">${formatPrice(product.price)}</span></td>
        <td><span class="stock-text">${product.stock ?? 0}</span></td>
        <td>
          <span class="badge-status ${statusClass}">${label}</span>
        </td>
        <td>
          <div class="action-cluster">
            <button class="btn-table-action btn-inspect" data-id="${product.id}" title="Détails" type="button">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
            <button class="btn-table-action btn-edit" data-id="${product.id}" title="Modifier" type="button">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="btn-table-action btn-del" data-id="${product.id}" title="Supprimer" type="button">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('') : `
    <tr>
      <td colspan="7" style="text-align: center; padding: 48px 20px; color: var(--text-muted);">
        Aucun produit ne correspond aux critères de recherche.
      </td>
    </tr>
  `;

  let paginationButtonsHtml = `
    <button class="page-btn btn-prev" data-page="${currentPage - 1}" type="button" aria-label="Précédent" ${currentPage <= 1 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>&lt;</button>
  `;
  for (let p = 1; p <= totalPages; p++) {
    paginationButtonsHtml += `
      <button class="page-btn ${p === currentPage ? 'active' : ''}" data-page="${p}" type="button">${p}</button>
    `;
  }
  paginationButtonsHtml += `
    <button class="page-btn btn-next" data-page="${currentPage + 1}" type="button" aria-label="Suivant" ${currentPage >= totalPages ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>&gt;</button>
  `;

  const selCat = filterState?.selectedCategory || 'all';
  const selStock = filterState?.selectedStock || 'all';
  const searchVal = escapeHtml(filterState?.searchQuery || '');

  card.innerHTML = `
    <div class="catalog-filter-bar">
      <div class="search-field-wrap">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input type="text" id="catalog-search-input" value="${searchVal}" placeholder="Rechercher par référence ou nom...">
      </div>

      <div class="select-wrapper">
        <svg class="left-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
          <line x1="7" y1="7" x2="7.01" y2="7"></line>
        </svg>
        <select id="filter-category-select">
          <option value="all" ${selCat === 'all' ? 'selected' : ''}>Toutes les catégories</option>
          <option value="peripheriques" ${selCat === 'peripheriques' ? 'selected' : ''}>Périphériques</option>
          <option value="ecrans" ${selCat === 'ecrans' ? 'selected' : ''}>Écrans</option>
          <option value="accessoires" ${selCat === 'accessoires' ? 'selected' : ''}>Accessoires</option>
        </select>
        <svg class="chevron-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      <div class="select-wrapper">
        <svg class="left-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        </svg>
        <select id="filter-stock-select">
          <option value="all" ${selStock === 'all' ? 'selected' : ''}>Tous les stocks</option>
          <option value="in_stock" ${selStock === 'in_stock' ? 'selected' : ''}>En stock</option>
          <option value="low_stock" ${selStock === 'low_stock' ? 'selected' : ''}>Stock faible</option>
          <option value="out_of_stock" ${selStock === 'out_of_stock' ? 'selected' : ''}>Rupture</option>
        </select>
        <svg class="chevron-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      <button class="btn-add-item" id="btn-create-item" type="button">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>Nouveau produit</span>
      </button>
    </div>

    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Référence</th>
            <th>Nom du produit</th>
            <th>Catégorie</th>
            <th>Prix (XOF)</th>
            <th>Stock</th>
            <th>État</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="catalog-rows-body">
          ${rows}
        </tbody>
      </table>
    </div>

    <div class="table-pagination-bar">
      <span class="table-count-info" id="pagination-info-label">
        Affichage de ${total === 0 ? 0 : startIdx + 1} à ${endIdx} sur ${total} produit${total > 1 ? 's' : ''}
      </span>
      <div class="pagination-controls">
        ${paginationButtonsHtml}
      </div>
    </div>
  `;

  card.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.btn-edit');
    const delBtn = e.target.closest('.btn-del');
    const viewBtn = e.target.closest('.btn-inspect');
    const pageBtn = e.target.closest('.page-btn');

    if (editBtn) onEdit(Number(editBtn.dataset.id));
    if (delBtn) onDelete(Number(delBtn.dataset.id));
    if (viewBtn && onView) onView(Number(viewBtn.dataset.id));
    if (pageBtn && onPageChange && !pageBtn.disabled) {
      const targetPage = Number(pageBtn.dataset.page);
      if (targetPage >= 1 && targetPage <= totalPages && targetPage !== currentPage) {
        onPageChange(targetPage);
      }
    }
  });

  return card;
}
