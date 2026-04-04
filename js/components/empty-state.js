import { store } from '../store.js';

class EmptyState extends HTMLElement {
  connectedCallback() {
    this._unsubs = [
      store.subscribe('brandExcludedCount', () => this._render()),
      store.subscribe('prefs', () => this._render()),
    ];
    this._render();
  }

  disconnectedCallback() {
    this._unsubs?.forEach(u => u());
  }

  _render() {
    const count = store.get('brandExcludedCount');
    const prefs = store.get('prefs');
    const hasBrandFilter = prefs.selectedBrands.length > 0;
    const dist = prefs.maxDistanceKm;

    const hint = hasBrandFilter && count > 0
      ? `<div class="empty-hint">${count} station${count > 1 ? 's' : ''} à proximité cachée${count > 1 ? 's' : ''} par les filtres de marque.</div>`
      : `<div class="empty-hint">Essayez d'augmenter la distance (actuellement ${dist} km).</div>`;

    const clearBtn = hasBrandFilter
      ? `<button class="clear-btn" id="clear-brands">Effacer les filtres de marque</button>`
      : '';

    this.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <div class="empty-title">Aucune station trouvée</div>
        <div class="empty-sub">Aucune station dans un rayon de ${dist} km ne correspond à vos filtres.</div>
        ${hint}
        ${clearBtn}
      </div>
    `;

    this.querySelector('#clear-brands')?.addEventListener('click', () => {
      const next = { ...store.get('prefs'), selectedBrands: [] };
      store.set('prefs', next);
      localStorage.setItem('gazradar_prefs', JSON.stringify(next));
    });
  }
}

customElements.define('empty-state', EmptyState);
