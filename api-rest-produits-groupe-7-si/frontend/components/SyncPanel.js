export function SyncPanel(onRunSync, onCompare) {
  const panel = document.createElement('div');
  panel.className = 'dash-panel';

  panel.innerHTML = `
    <div class="panel-title-row">
      <div class="panel-title-group">
        <div class="panel-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
          </svg>
        </div>
        <h2 class="panel-heading">Synchronisation & Transfert</h2>
      </div>
      <div class="status-pill">
        <span class="status-dot-green"></span>
        <span id="sync-live-status">Prêt</span>
      </div>
    </div>

    <div class="sync-databases-row">
      <div class="db-status-chip">
        <div class="db-icon-circle">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
          </svg>
        </div>
        <div class="db-info-meta">
          <span class="db-label-name">Source (PostgreSQL)</span>
          <span class="db-conn-indicator">Connectée</span>
          <span class="db-port-hint">schéma source</span>
        </div>
      </div>

      <div class="db-status-chip">
        <div class="db-icon-circle">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
            <line x1="6" y1="6" x2="6.01" y2="6"></line>
            <line x1="6" y1="18" x2="6.01" y2="18"></line>
          </svg>
        </div>
        <div class="db-info-meta">
          <span class="db-label-name">Cible (PostgreSQL)</span>
          <span class="db-conn-indicator">Connectée</span>
          <span class="db-port-hint">schéma cible</span>
        </div>
      </div>
    </div>

    <div style="margin-top: 14px; margin-bottom: 14px;">
      <div style="display: flex; gap: 8px;">
        <input type="text" id="sync-test-sku" placeholder="SKU produit à synchroniser (ex: KB-001)" style="flex:1; padding: 9px 12px; border: 1px solid var(--border-light); border-radius: var(--radius-md); font-size: 0.85rem; outline: none;">
        <button class="btn-add-item" id="btn-trigger-sync" type="button" style="height: 38px; padding: 0 14px;">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>Transférer en direct</span>
        </button>
      </div>
      <div id="sync-execution-feedback" style="display:none; margin-top: 10px; font-size: 0.82rem; padding: 8px 12px; border-radius: var(--radius-sm);"></div>
    </div>

    <div class="panel-actions-line">
      <button class="btn-secondary-action" id="btn-compare-data" type="button">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="16 3 21 3 21 8"></polyline>
          <line x1="4" y1="20" x2="21" y2="3"></line>
          <polyline points="21 16 21 21 16 21"></polyline>
          <line x1="15" y1="15" x2="21" y2="21"></line>
        </svg>
        <span>Comparer les données</span>
      </button>
      <a href="#synchronisation" class="link-subtle-arrow" id="link-show-diffs">
        <span>Voir les écarts</span>
        <span>→</span>
      </a>
    </div>
  `;

  const btnSync = panel.querySelector('#btn-trigger-sync');
  const inputSku = panel.querySelector('#sync-test-sku');
  const feedback = panel.querySelector('#sync-execution-feedback');

  btnSync?.addEventListener('click', async () => {
    const sku = inputSku?.value?.trim() || 'KB-001';
    if (!sku) return;
    btnSync.disabled = true;
    btnSync.innerHTML = '<span>Transfert...</span>';
    feedback.style.display = 'block';
    feedback.style.background = '#eff6ff';
    feedback.style.color = '#1d4ed8';
    feedback.textContent = `Appel WSO2 pour ${sku}...`;

    try {
      const res = await onRunSync(sku);
      feedback.style.background = '#ecfdf5';
      feedback.style.color = '#047857';
      feedback.textContent = `Succès : ${typeof res === 'string' ? res : 'Produit synchronisé vers PostgreSQL'}`;
    } catch (err) {
      feedback.style.background = '#fef2f2';
      feedback.style.color = '#b91c1c';
      feedback.textContent = `Erreur de transfert : ${err.message}`;
    } finally {
      btnSync.disabled = false;
      btnSync.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Transférer en direct</span>';
    }
  });

  panel.querySelector('#btn-compare-data')?.addEventListener('click', () => {
    if (onCompare) onCompare();
  });

  return panel;
}
