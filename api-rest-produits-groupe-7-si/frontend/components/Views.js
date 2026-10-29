import { $ } from '../utils/dom.js';

export function renderDocumentationView(container) {
  container.innerHTML = `
    <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; margin-bottom: 24px;">
      <!-- Console de test interactive -->
      <div class="dash-panel">
        <div class="panel-title-row" style="margin-bottom: 14px;">
          <div style="display: flex; gap: 6px;" id="doc-code-tabs">
            <button class="page-btn active" data-lang="curl" type="button" style="padding: 6px 14px; height: 32px; font-weight: 700;">CURL</button>
            <button class="page-btn" data-lang="js" type="button" style="padding: 6px 14px; height: 32px; font-weight: 700;">JS (Fetch)</button>
            <button class="page-btn" data-lang="python" type="button" style="padding: 6px 14px; height: 32px; font-weight: 700;">Python</button>
          </div>
          <button class="btn-secondary-action" id="btn-copy-code" type="button" style="padding: 4px 10px; font-size: 0.78rem;">
            Copier
          </button>
        </div>

        <pre id="code-snippet-box" style="background: #0f172a; color: #f8fafc; padding: 14px; border-radius: var(--radius-md); font-family: monospace; font-size: 0.8rem; overflow-x: auto; margin-bottom: 16px; line-height: 1.4;">curl -X GET "http://localhost:8001/api/v1/products" \\
  -H "Accept: application/json"</pre>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div style="background: #ffffff; border: 1px solid var(--border-light); padding: 10px 12px; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="font-size: 0.82rem; display: block; color: var(--text-main);">Requête globale</strong>
              <small style="color: var(--text-muted); font-size: 0.74rem;">GET /api/v1/products</small>
            </div>
            <button class="btn-table-action btn-try-endpoint" data-endpoint="/api/v1/products" data-method="GET" type="button" style="width: auto; padding: 4px 10px; font-size: 0.78rem; font-weight: 600;">Tester</button>
          </div>

          <div style="background: #ffffff; border: 1px solid var(--border-light); padding: 10px 12px; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="font-size: 0.82rem; display: block; color: var(--text-main);">Santé de l'API</strong>
              <small style="color: var(--text-muted); font-size: 0.74rem;">GET /health</small>
            </div>
            <button class="btn-table-action btn-try-endpoint" data-endpoint="/health" data-method="GET" type="button" style="width: auto; padding: 4px 10px; font-size: 0.78rem; font-weight: 600;">Tester</button>
          </div>

          <div style="background: #ffffff; border: 1px solid var(--border-light); padding: 10px 12px; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="font-size: 0.82rem; display: block; color: var(--text-main);">Détail produit</strong>
              <small style="color: var(--text-muted); font-size: 0.74rem;">GET /api/v1/products/4</small>
            </div>
            <button class="btn-table-action btn-try-endpoint" data-endpoint="/api/v1/products/4" data-method="GET" type="button" style="width: auto; padding: 4px 10px; font-size: 0.78rem; font-weight: 600;">Tester</button>
          </div>

          <div style="background: #ffffff; border: 1px solid var(--border-light); padding: 10px 12px; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="font-size: 0.82rem; display: block; color: var(--text-main);">WSO2 Transfer</strong>
              <small style="color: var(--text-muted); font-size: 0.74rem;">POST /products/transfer</small>
            </div>
            <button class="btn-table-action btn-try-endpoint" data-endpoint="/api-wso2/products/transfer" data-method="POST" data-body='{"sku":"KB-001"}' type="button" style="width: auto; padding: 4px 10px; font-size: 0.78rem; font-weight: 600;">Tester</button>
          </div>
        </div>
      </div>

      <!-- Résultat en direct -->
      <div class="dash-panel" style="display: flex; flex-direction: column;">
        <div class="panel-title-row" style="margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="status-dot-green"></span>
            <h3 style="font-size: 1rem; font-weight: 700;">Résultat en direct</h3>
          </div>
          <span class="badge-status status-en-stock" id="doc-response-status">200 OK</span>
        </div>
        <pre id="doc-response-box" style="flex: 1; background: #0f172a; color: #38bdf8; padding: 14px; border-radius: var(--radius-md); font-family: monospace; font-size: 0.78rem; overflow: auto; min-height: 220px; max-height: 380px; line-height: 1.4;">{\n  "status": "ready",\n  "message": "Cliquez sur Tester pour exécuter une requête live"\n}</pre>
      </div>
    </div>
  `;

  attachDocumentationEvents(container);
}

function attachDocumentationEvents(container) {
  const codeBox = container.querySelector('#code-snippet-box');
  const responseBox = container.querySelector('#doc-response-box');
  const statusBadge = container.querySelector('#doc-response-status');
  const copyBtn = container.querySelector('#btn-copy-code');
  let currentEndpoint = '/api/v1/products';

  const snippets = {
    curl: (ep) => `curl -X GET "http://localhost:8001${ep}" \\\n  -H "Accept: application/json"`,
    js: (ep) => `fetch("http://localhost:8001${ep}")\n  .then(res => res.json())\n  .then(data => console.log(data));`,
    python: (ep) => `import requests\n\nres = requests.get("http://localhost:8001${ep}")\nprint(res.json())`
  };

  container.querySelectorAll('#doc-code-tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('#doc-code-tabs button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const lang = btn.dataset.lang;
      if (snippets[lang]) codeBox.textContent = snippets[lang](currentEndpoint);
    });
  });

  copyBtn?.addEventListener('click', () => {
    navigator.clipboard.writeText(codeBox.textContent);
    copyBtn.textContent = 'Copié !';
    setTimeout(() => copyBtn.textContent = 'Copier', 1800);
  });

  container.querySelectorAll('.btn-try-endpoint').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ep = btn.dataset.endpoint;
      const method = btn.dataset.method;
      currentEndpoint = ep;

      const activeLang = container.querySelector('#doc-code-tabs button.active')?.dataset.lang || 'curl';
      if (snippets[activeLang]) codeBox.textContent = snippets[activeLang](ep);

      statusBadge.textContent = 'Appel en cours...';
      responseBox.textContent = 'Chargement de la réponse du serveur...';

      try {
        const url = ep.startsWith('/api-wso2') ? ep : `/api-backend${ep}`;
        const options = { method, headers: { 'Accept': 'application/json' } };
        if (btn.dataset.body) {
          options.headers['Content-Type'] = 'application/json';
          options.body = btn.dataset.body;
        }

        const res = await fetch(url, options);
        statusBadge.textContent = `${res.status} ${res.statusText || 'OK'}`;
        statusBadge.className = res.ok ? 'badge-status status-en-stock' : 'badge-status status-rupture';
        const data = await res.json().catch(() => ({ status: res.statusText }));
        responseBox.textContent = JSON.stringify(data, null, 2);
      } catch (err) {
        statusBadge.textContent = 'Erreur réseau';
        statusBadge.className = 'badge-status status-rupture';
        responseBox.textContent = JSON.stringify({ error: err.message }, null, 2);
      }
    });
  });
}

export function renderIntegrationView(container, gatewayInfo) {
  container.innerHTML = `
    <div class="dash-panel" style="margin-bottom: 24px;">
      <div class="panel-title-row">
        <div class="panel-title-group">
          <div class="panel-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
          </div>
          <h2 class="panel-heading">Passerelle WSO2 Micro Integrator</h2>
        </div>
        <span class="status-pill"><span class="status-dot-green"></span> En ligne</span>
      </div>

      <div class="gateway-endpoint-row">
        <span class="gateway-endpoint-label">Endpoint de synchronisation :</span>
        <span class="gateway-code-box">http://localhost:8291/products/transfer</span>
      </div>

      <div class="gateway-log-pill" style="margin-top: 14px;">
        <div class="gateway-log-left">
          <span class="status-dot-green"></span>
          <span class="method-tag" style="color:#2563eb;">POST</span>
          <span>/products/transfer</span>
          <span class="status-code-tag">→ 200 OK</span>
          <span>→ Transfert du schéma source vers le schéma cible</span>
        </div>
        <span class="log-date-text">Actif</span>
      </div>

      <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 16px;">
        Le composant WSO2 assure la médiation des données entre la base source et la base cible.
      </p>
    </div>
  `;
}
