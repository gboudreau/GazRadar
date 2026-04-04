import { store } from '../store.js';
import { getBrandStyle } from '../brands.js';

class StationCard extends HTMLElement {
  static get observedAttributes() { return ['station-id']; }

  connectedCallback() {
    this._expanded = false;
    this._render();
    this.addEventListener('click', this._handleClick);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this._handleClick);
  }

  set station(s) {
    if (this._station?.id !== s.id) this._expanded = false;
    this._station = s;
    this._render();
  }

  _handleClick = (e) => {
    if (e.target.closest('.map-btn')) return;
    this._expanded = !this._expanded;
    this._render();
  };

  _render() {
    const s = this._station;
    if (!s) return;
    const prefs = store.get('prefs');
    const allGasTypes = store.get('availableGasTypes');
    const brandStyle = getBrandStyle(s.brand);

    const distText = s.distanceKm < Infinity
      ? `${s.distanceKm.toFixed(1)} km`
      : '— km';

    // Compute per-type minimum price across all visible results
    const minPriceByType = {};
    for (const st of store.get('filteredStations')) {
      for (const [type, price] of Object.entries(st.prices)) {
        if (price != null && (minPriceByType[type] == null || price < minPriceByType[type])) {
          minPriceByType[type] = price;
        }
      }
    }

    const selectedChips = prefs.selectedGasTypes
      .filter(t => s.prices[t] != null)
      .map(t => {
        const isBest = s.isBestDeal && s.prices[t] === s.effectivePrice;
        const minPrice = minPriceByType[t] ?? s.prices[t];
        const deltaPct = Math.round((s.prices[t] - minPrice) / minPrice * 100);
        const deltaStr = deltaPct > 0 ? `+${deltaPct}%` : null;
        return `
          <div class="price-chip ${isBest ? 'best' : ''}">
            <span class="price-chip-label">${t}</span>
            <span class="price-chip-value">${s.prices[t].toFixed(1)}¢</span>
            ${isBest ? '<span class="best-badge">🔥 MEILLEUR PRIX</span>' : ''}
            ${deltaStr ? `<span class="price-delta">${deltaStr}</span>` : ''}
          </div>`;
      }).join('');

    const collapsedHTML = `
      <div class="card-collapsed">
        <div class="card-row-1">
          <span class="station-name">${this._esc(s.name)}</span>
          <span class="station-distance">${distText}</span>
        </div>
        <div class="card-row-2">
          <span class="brand-pill"
            style="background:${brandStyle.bg};color:${brandStyle.text}">
            ${this._esc(s.brand)}
          </span>
          <span class="station-address">${this._esc(s.address)}</span>
        </div>
        <div class="card-row-3">${selectedChips}</div>
      </div>`;

    const GAS_TYPE_ORDER = ['Régulier', 'Super', 'Diesel'];
    const sortedGasTypes = [...allGasTypes].sort((a, b) => {
      const ia = GAS_TYPE_ORDER.indexOf(a);
      const ib = GAS_TYPE_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b, 'fr');
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

    const allChips = sortedGasTypes.map(t => {
      const price = s.prices[t];
      return `
        <div class="price-chip">
          <span class="price-chip-label">${t}</span>
          <span class="price-chip-value">${price != null ? price.toFixed(1) + '¢' : '—'}</span>
        </div>`;
    }).join('');

    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`;
    const wazeUrl = `https://waze.com/ul?ll=${s.lat},${s.lng}&navigate=yes`;

    const expandedHTML = this._expanded ? `
      <div class="card-expanded">
        <div>
          <div class="expanded-label">Tous les carburants</div>
          <div class="all-prices">${allChips}</div>
        </div>
        <div class="map-buttons">
          <a href="${mapsUrl}" target="_blank" rel="noopener" class="map-btn gmaps">🗺 Google Maps</a>
          <a href="${wazeUrl}" target="_blank" rel="noopener" class="map-btn waze">🚗 Waze</a>
        </div>
      </div>` : '';

    this.innerHTML = `<div class="station-card">${collapsedHTML}${expandedHTML}</div>`;
  }

  _esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

customElements.define('station-card', StationCard);
