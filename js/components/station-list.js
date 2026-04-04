import { store } from '../store.js';
import './station-card.js';
import './empty-state.js';

class StationList extends HTMLElement {
  connectedCallback() {
    this._unsubs = [
      store.subscribe('filteredStations', () => this._render()),
      store.subscribe('dataStatus', () => this._render()),
      store.subscribe('locationStatus', () => this._render()),
    ];
    this._render();
  }

  disconnectedCallback() {
    this._unsubs?.forEach(u => u());
  }

  _render() {
    const dataStatus     = store.get('dataStatus');
    const locationStatus = store.get('locationStatus');
    const stations       = store.get('filteredStations');

    if (locationStatus === 'denied') {
      this.innerHTML = `
        <div class="location-denied">
          <div style="font-size:48px">📍</div>
          <div style="font-size:17px;font-weight:700">Localisation requise</div>
          <div style="font-size:14px;color:var(--text-secondary);line-height:1.5">
            GazRadar a besoin de votre position pour trouver les stations proches.
          </div>
          <button class="retry-btn" id="retry-location">Réessayer</button>
        </div>`;
      this.querySelector('#retry-location')?.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('gazradar:retry-location'));
      });
      return;
    }

    if (dataStatus === 'error') {
      this.innerHTML = `
        <div class="location-denied">
          <div style="font-size:48px">⚠️</div>
          <div style="font-size:17px;font-weight:700">Erreur de chargement</div>
          <div style="font-size:14px;color:var(--text-secondary)">
            Impossible de charger les données. Vérifiez votre connexion.
          </div>
          <button class="retry-btn" id="retry-fetch">Réessayer</button>
        </div>`;
      this.querySelector('#retry-fetch')?.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('gazradar:refresh'));
      });
      return;
    }

    if (dataStatus === 'loading' || dataStatus === 'idle') {
      this.innerHTML = `
        <div class="station-list">
          ${Array(4).fill(0).map(() => `
            <div class="skeleton">
              <div class="skeleton-line" style="height:18px;width:60%"></div>
              <div class="skeleton-line" style="height:13px;width:40%"></div>
              <div class="skeleton-line" style="height:36px;width:50%"></div>
            </div>`).join('')}
        </div>`;
      return;
    }

    if (locationStatus === 'pending') {
      this.innerHTML = `
        <div class="location-pending">
          <div class="location-pending-spinner"></div>
          <div style="font-size:17px;font-weight:700">Localisation en cours…</div>
          <div style="font-size:14px;color:var(--text-secondary)">
            Les stations s'afficheront dès que votre position sera connue.
          </div>
        </div>`;
      return;
    }

    if (!stations.length) {
      this.innerHTML = '<empty-state></empty-state>';
      return;
    }

    // Reset if coming from skeleton/error/empty state
    const existingList = this.querySelector('.station-list');
    if (!existingList || existingList.querySelector('.skeleton')) {
      this.innerHTML = '<div class="results-summary"></div><div class="station-list"></div>';
    }

    // Update summary bar
    this._renderSummary(this.querySelector('.results-summary'), stations);

    // Reuse / create station cards
    const listEl  = this.querySelector('.station-list');
    const existing = [...listEl.querySelectorAll('station-card')];

    stations.forEach((s, i) => {
      let card = existing[i];
      if (!card) {
        card = document.createElement('station-card');
        listEl.appendChild(card);
      }
      card.station = s;
    });

    while (listEl.children.length > stations.length) {
      listEl.removeChild(listEl.lastChild);
    }
  }

  _renderSummary(el, stations) {
    if (!el) return;

    const prices = stations.map(s => s.effectivePrice).filter(p => p != null && p !== Infinity);
    if (!prices.length) { el.innerHTML = ''; return; }

    const sorted = [...prices].sort((a, b) => a - b);
    const min    = sorted[0];
    const max    = sorted[sorted.length - 1];
    const mid    = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

    const medDelta = Math.round((median - min) / min * 100);
    const maxDelta = Math.round((max - min) / min * 100);
    const fmt      = p => p.toFixed(1) + '¢';
    const count    = stations.length;

    el.innerHTML = `
      <div class="summary-card">
        <div class="summary-stats">
          <div class="summary-stat">
            <span class="summary-stat-val">${fmt(min)}</span>
            <span class="summary-stat-label">Min</span>
          </div>
          <div class="summary-stat-divider"></div>
          <div class="summary-stat">
            <span class="summary-stat-val">${fmt(median)}</span>
            ${medDelta > 0 ? `<span class="summary-stat-delta">+${medDelta}%</span>` : ''}
            <span class="summary-stat-label">Médiane</span>
          </div>
          <div class="summary-stat-divider"></div>
          <div class="summary-stat">
            <span class="summary-stat-val">${fmt(max)}</span>
            ${maxDelta > 0 ? `<span class="summary-stat-delta">+${maxDelta}%</span>` : ''}
            <span class="summary-stat-label">Max</span>
          </div>
        </div>
        <div class="summary-count">${count} station${count > 1 ? 's' : ''}</div>
      </div>`;
  }
}

customElements.define('station-list', StationList);
