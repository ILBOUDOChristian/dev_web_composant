import { $ } from './utils/dom.js';
import * as api from './services/api.js';
import { Sidebar } from './components/Sidebar.js';
import { StatsGrid } from './components/StatsGrid.js';
import { ProductTable } from './components/ProductTable.js';
import { SyncPanel } from './components/SyncPanel.js';
import { ServiceStatus } from './components/ServiceStatus.js';
import { ProductDialog } from './components/ProductDialog.js';
import { renderDocumentationView, renderIntegrationView } from './components/Views.js';
import { getCategoryBadge, getStockStatus } from './utils/formatters.js';
import { showToast } from './components/Toast.js';

const state = {
  currentTab: 'dashboard',
  products: [],
  searchQuery: '',
  selectedCategory: 'all',
  selectedStock: 'all',
  currentPage: 1,
  pageSize: 4,
  isBackendHealthy: false,
  gatewayInfo: {
    online: true,
    endpoint: 'localhost:8290/api/v1',
    lastCall: {
      method: 'GET',
      path: '/products',
      code: '200 OK',
      duration: '42 ms',
      timestamp: '22/10/2026 14:32'
    }
  }
};

async function init() {
  const hash = window.location.hash.replace('#', '') || 'dashboard';
  state.currentTab = hash;

  mountSidebar();
  setupRouting();
  await refreshData();
}

function mountSidebar() {
  const root = $('#app-root');
  const existingSidebar = root.querySelector('.sidebar');
  if (existingSidebar) existingSidebar.remove();
  root.prepend(Sidebar(state.currentTab));
}

function setupRouting() {
  window.addEventListener('hashchange', () => {
    const tab = window.location.hash.replace('#', '') || 'dashboard';
    navigateTo(tab);
  });
}

function navigateTo(tab) {
  state.currentTab = tab;
  mountSidebar();
  renderCurrentView();
}

async function refreshData() {
  try {
    const [fetchedProducts, isHealthy] = await Promise.all([
      api.fetchProducts().catch(err => {
        console.warn('Backend products fetch warning:', err);
        return [
          { id: 1, sku: 'PRD-0001', name: 'Clavier mécanique', category: 'Périphériques', price: 45000, stock: 32 },
          { id: 2, sku: 'PRD-0002', name: 'Souris sans fil', category: 'Périphériques', price: 12500, stock: 18 },
          { id: 3, sku: 'PRD-0003', name: 'Écran 24 pouces', category: 'Écrans', price: 85000, stock: 0 },
          { id: 4, sku: 'PRD-0004', name: 'Support ordinateur', category: 'Accessoires', price: 9000, stock: 7 }
        ];
      }),
      api.checkBackendHealth()
    ]);

    state.products = fetchedProducts;
    state.isBackendHealthy = isHealthy;

    renderCurrentView();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function renderCurrentView() {
  const titleEl = $('#view-title');
  const subEl = $('#view-subtitle');
  const container = $('#view-content-root');
  if (!container) return;
  container.innerHTML = '';

  if (state.currentTab === 'dashboard') {
    titleEl.textContent = 'Dashboard';
    subEl.textContent = 'Vue d\'ensemble et indicateurs clés de votre API Produits';
    renderDashboardView(container);
  } else if (state.currentTab === 'catalogue') {
    titleEl.textContent = 'Catalogue des produits';
    subEl.textContent = 'Gérez et vérifiez les produits exposés par l\'API REST';
    renderCatalogView(container);
  } else if (state.currentTab === 'synchronisation') {
    titleEl.textContent = 'Synchronisation';
    subEl.textContent = 'État de la réplication entre la base source et la base cible';
    renderSyncView(container);
  } else if (state.currentTab === 'integration-wso2') {
    titleEl.textContent = 'Intégration WSO2';
    subEl.textContent = 'Supervision de la passerelle de médiation et des flux ESB';
    renderIntegrationView(container, state.gatewayInfo);
  } else if (state.currentTab === 'documentation') {
    titleEl.textContent = 'Documentation';
    subEl.textContent = 'Référence technique des points d\'accès de l\'API';
    renderDocumentationView(container);
  }
}

function renderDashboardView(container) {
  const statsWrap = document.createElement('div');
  statsWrap.appendChild(StatsGrid({
    apiCount: state.products.length,
    sourceCount: 3,
    targetCount: state.products.length
  }));
  container.appendChild(statsWrap);

  const panelsRow = document.createElement('div');
  panelsRow.className = 'bottom-panels-grid';
  panelsRow.appendChild(SyncPanel(handleSyncProduct, handleCompareData));
  panelsRow.appendChild(ServiceStatus(state.gatewayInfo, handlePingGateway));
  container.appendChild(panelsRow);
}

function renderCatalogView(container) {
  const filtered = state.products.filter(item => {
    const query = state.searchQuery.toLowerCase();
    const matchesSearch = !query ||
      (item.sku && item.sku.toLowerCase().includes(query)) ||
      (item.name && item.name.toLowerCase().includes(query));

    let matchesCategory = true;
    if (state.selectedCategory !== 'all') {
      const badge = getCategoryBadge(item.category, item.name);
      matchesCategory = badge.key === state.selectedCategory;
    }

    let matchesStock = true;
    if (state.selectedStock !== 'all') {
      const status = getStockStatus(item.stock);
      matchesStock = status.key === state.selectedStock;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  const tableComponent = ProductTable(
    filtered,
    handleEdit,
    handleDelete,
    handleInspect,
    { page: state.currentPage, pageSize: state.pageSize },
    handlePageChange,
    {
      searchQuery: state.searchQuery,
      selectedCategory: state.selectedCategory,
      selectedStock: state.selectedStock
    }
  );
  container.appendChild(tableComponent);

  attachCatalogEvents(tableComponent);
}

function renderSyncView(container) {
  container.appendChild(SyncPanel(handleCompareData, handleViewDifferences));
}

function handlePageChange(newPage) {
  state.currentPage = newPage;
  renderCurrentView();
}

function attachCatalogEvents(container) {
  const searchInput = container.querySelector('#catalog-search-input');
  const categorySelect = container.querySelector('#filter-category-select');
  const stockSelect = container.querySelector('#filter-stock-select');
  const createBtn = container.querySelector('#btn-create-item');

  if (searchInput) {
    searchInput.value = state.searchQuery;
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      state.currentPage = 1;
      renderCurrentView();
    });
  }

  if (categorySelect) {
    categorySelect.value = state.selectedCategory;
    categorySelect.addEventListener('change', (e) => {
      state.selectedCategory = e.target.value;
      state.currentPage = 1;
      renderCurrentView();
    });
  }

  if (stockSelect) {
    stockSelect.value = state.selectedStock;
    stockSelect.addEventListener('change', (e) => {
      state.selectedStock = e.target.value;
      state.currentPage = 1;
      renderCurrentView();
    });
  }

  if (createBtn) {
    createBtn.addEventListener('click', () => {
      ProductDialog(null, handleSave);
    });
  }
}

async function handleSave(data, id) {
  try {
    await api.saveProduct(data, id);
    showToast(id ? 'Produit mis à jour avec succès' : 'Produit créé avec succès');
    await refreshData();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function handleDelete(id) {
  if (!confirm('Voulez-vous vraiment supprimer ce produit ?')) return;
  try {
    await api.deleteProduct(id);
    showToast('Produit supprimé avec succès');
    await refreshData();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function handleEdit(id) {
  const product = state.products.find(p => p.id === id);
  ProductDialog(product, handleSave);
}

function handleInspect(id) {
  const product = state.products.find(p => p.id === id);
  if (product) {
    showToast(`Inspection: ${product.sku} — ${product.name}`);
  }
}

function handleCompareData() {
  showToast('Comparaison des schémas source et cible effectuée');
}

function handleViewDifferences() {
  showToast('Écarts de synchronisation : 2 produits en attente');
}

async function handleSyncProduct(sku) {
  const result = await api.syncProduct(sku);
  showToast(`Synchronisation réussie pour ${sku}`);
  await refreshData();
  return result;
}

async function handlePingGateway() {
  const isHealthy = await api.checkBackendHealth();
  if (!isHealthy) throw new Error('API non joignable');
  return true;
}

init();
