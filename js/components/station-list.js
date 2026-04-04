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

    if (!stations.length) {
      this.innerHTML = '<empty-state></empty-state>';
      return;
    }

    const existingList = this.querySelector('.station-list');
    if (!existingList || existingList.querySelector('.skeleton')) {
      this.innerHTML = '<div class="station-list"></div>';
    }
    const listEl = this.querySelector('.station-list');
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
}

customElements.define('station-list', StationList);
