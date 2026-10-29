export function StatsGrid(data = { apiCount: 0, sourceCount: 3, targetCount: 0 }) {
  const container = document.createElement('div');
  container.className = 'stats-row';

  const apiCount = data.apiCount ?? 0;
  const sourceCount = data.sourceCount ?? 3;
  const targetCount = data.targetCount ?? apiCount;

  container.innerHTML = `
    <div class="stat-item">
      <div class="stat-item-left">
        <div class="stat-circle tone-blue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
        </div>
        <div>
          <span class="stat-title">Produits exposés par l'API</span>
          <span class="stat-number">${apiCount}</span>
          <span class="stat-caption">Articles actifs et distribués via l'API REST</span>
        </div>
      </div>
      <span class="stat-trend-chip trend-up">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>
        <span>Actif</span>
      </span>
    </div>

    <div class="stat-item">
      <div class="stat-item-left">
        <div class="stat-circle tone-green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
          </svg>
        </div>
        <div>
          <span class="stat-title">Entrepôt source (PostgreSQL)</span>
          <span class="stat-number">${sourceCount}</span>
          <span class="stat-caption">Produits référencés dans la base source</span>
        </div>
      </div>
      <span class="stat-trend-chip">
        <span>PostgreSQL</span>
      </span>
    </div>

    <div class="stat-item">
      <div class="stat-item-left">
        <div class="stat-circle tone-purple">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
            <line x1="6" y1="6" x2="6.01" y2="6"></line>
            <line x1="6" y1="18" x2="6.01" y2="18"></line>
          </svg>
        </div>
        <div>
          <span class="stat-title">Base de destination (PostgreSQL)</span>
          <span class="stat-number">${targetCount}</span>
          <span class="stat-caption">Produits synchronisés dans le schéma cible</span>
        </div>
      </div>
      <span class="stat-trend-chip trend-up">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span>Synchronisé</span>
      </span>
    </div>
  `;

  return container;
}
