export function ServiceStatus(gatewayInfo = {}, onPingGateway) {
  const panel = document.createElement('div');
  panel.className = 'dash-panel';

  const isOnline = gatewayInfo.online ?? true;
  const endpoint = gatewayInfo.endpoint || 'localhost:8290/api/v1';

  panel.innerHTML = `
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
        <h2 class="panel-heading">Passerelle WSO2</h2>
      </div>
      <div class="status-pill">
        <span class="status-dot-green"></span>
        <span id="gateway-live-badge">${isOnline ? 'En ligne' : 'Indisponible'}</span>
      </div>
    </div>

    <div class="gateway-endpoint-row">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
      </svg>
      <span class="gateway-endpoint-label">Endpoint</span>
      <span class="gateway-code-box">${endpoint}</span>
    </div>

    <div class="gateway-log-pill" id="gateway-log-display">
      <div class="gateway-log-left">
        <span class="status-dot-green"></span>
        <span class="method-tag">POST</span>
        <span>/products/transfer</span>
        <span class="status-code-tag">→ 200 OK</span>
        <span>→ WSO2 MI</span>
      </div>
      <span class="log-date-text" id="gateway-latency">Actif</span>
    </div>

    <div class="panel-actions-line">
      <button class="btn-secondary-action" id="btn-test-gateway-live" type="button" style="padding: 7px 14px; font-size: 0.82rem;">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        <span>Tester la passerelle en live</span>
      </button>
      <a href="#integration-wso2" class="link-subtle-arrow">
        <span>Détails médiation</span>
        <span>→</span>
      </a>
    </div>
  `;

  panel.querySelector('#btn-test-gateway-live')?.addEventListener('click', async () => {
    const btn = panel.querySelector('#btn-test-gateway-live');
    const logBox = panel.querySelector('#gateway-log-display');
    const startTime = Date.now();
    btn.disabled = true;
    btn.innerHTML = '<span>Ping en cours...</span>';

    try {
      if (onPingGateway) await onPingGateway();
      const latency = Date.now() - startTime;
      logBox.style.background = '#f0fdf4';
      logBox.innerHTML = `
        <div class="gateway-log-left">
          <span class="status-dot-green"></span>
          <span class="method-tag">PING</span>
          <span>WSO2 Gateway</span>
          <span class="status-code-tag">→ Réponse OK</span>
          <span>→ ${latency} ms</span>
        </div>
        <span class="log-date-text">À l'instant</span>
      `;
    } catch (err) {
      logBox.style.background = '#fef2f2';
      logBox.innerHTML = `
        <div class="gateway-log-left">
          <span style="color: #ef4444;">●</span>
          <span class="method-tag" style="color:#ef4444;">ERR</span>
          <span>WSO2 Gateway</span>
          <span class="status-code-tag" style="color:#ef4444;">→ Erreur</span>
        </div>
        <span class="log-date-text">${err.message}</span>
      `;
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg><span>Tester la passerelle en live</span>';
    }
  });

  return panel;
}
