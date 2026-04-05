import { store } from '../store.js';

const GAS_ORDER = ['Régulier', 'Super', 'Diesel'];
const PREFS_KEY = 'gazradar_prefs';

class QuickFilters extends HTMLElement {
  _distanceOpen = false;

  connectedCallback() {
    this._unsubs = [
      store.subscribe('prefs',              () => this._render()),
      store.subscribe('availableGasTypes',  () => this._render()),
    ];
    this._render();
    this.addEventListener('click', this._onClick.bind(this));
  }

  disconnectedCallback() {
    this._unsubs?.forEach(u => u());
  }

  _render() {
    const prefs     = store.get('prefs');
    const available = store.get('availableGasTypes');
    const { selectedGasTypes, maxDistanceKm, sortBy } = prefs;

    const gasLabel  = selectedGasTypes[0] ?? GAS_ORDER[0];
    const sortLabel = sortBy === 'price' ? '💰 Prix' : '📍 Distance';
    const sortIcon  = '↕';

    this.innerHTML = `
      <div class="quick-filters">
        <div class="qf-row">
          <button class="qf-chip" data-action="gas">${gasLabel}</button>
          <button class="qf-chip qf-chip--distance ${this._distanceOpen ? 'qf-chip--active' : ''}"
            data-action="distance">${maxDistanceKm} km</button>
          <button class="qf-chip" data-action="sort">${sortIcon} ${sortLabel}</button>
        </div>
        ${this._distanceOpen ? `
          <div class="qf-distance-panel">
            <input type="range" class="distance-slider" id="qf-slider"
              min="1" max="50" step="1" value="${maxDistanceKm}" />
            <span class="distance-val" id="qf-distance-val">${maxDistanceKm} km</span>
          </div>` : ''}
      </div>`;

    if (this._distanceOpen) {
      const slider = this.querySelector('#qf-slider');
      const label  = this.querySelector('#qf-distance-val');
      slider?.addEventListener('input', e => {
        if (label) label.textContent = `${Number(e.target.value)} km`;
      });
      slider?.addEventListener('change', e => {
        this._savePrefs({ maxDistanceKm: Number(e.target.value) });
      });
    }
  }

  _onClick(e) {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (!action) return;

    const prefs     = store.get('prefs');
    const available = store.get('availableGasTypes');

    if (action === 'gas') {
      const ordered = GAS_ORDER.filter(t => available.includes(t));
      if (!ordered.length) return;
      const current = prefs.selectedGasTypes[0];
      const idx     = ordered.indexOf(current);
      const next    = ordered[(idx + 1) % ordered.length];
      this._savePrefs({ selectedGasTypes: [next] });

    } else if (action === 'distance') {
      this._distanceOpen = !this._distanceOpen;
      this._render();

    } else if (action === 'sort') {
      this._savePrefs({ sortBy: prefs.sortBy === 'price' ? 'distance' : 'price' });
    }
  }

  _savePrefs(patch) {
    const next = { ...store.get('prefs'), ...patch };
    store.set('prefs', next);
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  }
}

customElements.define('quick-filters', QuickFilters);
