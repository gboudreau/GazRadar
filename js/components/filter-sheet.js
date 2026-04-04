import { store } from '../store.js';
import { getBrandStyle } from '../brands.js';

const PREFS_KEY = 'gazradar_prefs';

class FilterSheet extends HTMLElement {
  connectedCallback() {
    this._unsubs = [
      store.subscribe('filterSheetOpen', open => this._setOpen(open)),
      store.subscribe('availableBrands',  () => this._renderBrandGrid()),
      store.subscribe('availableGasTypes', () => this._renderGasTypes()),
      // Re-sync pill selection state when prefs are changed externally
      // (e.g. "Clear Brand Filters" from empty-state)
      store.subscribe('prefs', () => { this._renderBrandGrid(); this._renderGasTypes(); }),
    ];
    this._buildShell();
    this._setOpen(store.get('filterSheetOpen'));
  }

  disconnectedCallback() {
    this._unsubs?.forEach(u => u());
  }

  _buildShell() {
    const prefs = store.get('prefs');
    this.innerHTML = `
      <div class="sheet-backdrop" id="sheet-backdrop"></div>
      <div class="filter-sheet" id="filter-sheet" role="dialog" aria-modal="true">
        <div class="sheet-handle"></div>

        <div class="sheet-section">
          <div class="sheet-section-title">Marques</div>
          <div class="brand-grid" id="brand-grid"></div>
        </div>

        <div class="sheet-section">
          <div class="sheet-section-title">Type de carburant</div>
          <div class="gas-type-row" id="gas-type-row"></div>
        </div>

        <div class="sheet-section">
          <div class="sheet-section-title">Distance maximale</div>
          <div class="distance-row">
            <span>Distance</span>
            <span class="distance-val" id="distance-val">${prefs.maxDistanceKm} km</span>
          </div>
          <input type="range" class="distance-slider" id="distance-slider"
            min="1" max="50" step="1" value="${prefs.maxDistanceKm}" />
        </div>

        <div class="sheet-section">
          <div class="sheet-section-title">Trier par</div>
          <div class="segmented-control">
            <button class="seg-option ${prefs.sortBy === 'price' ? 'active' : ''}"
              data-sort="price">💰 Prix</button>
            <button class="seg-option ${prefs.sortBy === 'distance' ? 'active' : ''}"
              data-sort="distance">📍 Distance</button>
          </div>
        </div>
      </div>
    `;

    this._attachStaticListeners();
    this._renderBrandGrid();
    this._renderGasTypes();
  }

  _esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  _renderBrandGrid() {
    const grid = this.querySelector('#brand-grid');
    if (!grid) return;
    const brands = [...store.get('availableBrands')].sort((a, b) => {
      if (a === 'Inconnu') return 1;
      if (b === 'Inconnu') return -1;
      return 0;
    });
    const selected = store.get('prefs').selectedBrands;
    grid.innerHTML = brands.map(brand => {
      const style = getBrandStyle(brand);
      const isSelected = selected.includes(brand);
      const isUnknown = brand === 'Inconnu';
      return `<button class="brand-filter-pill ${isSelected ? 'selected' : ''} ${isUnknown ? 'brand-unknown' : ''}"
                style="background:${style.bg};color:${style.text}"
                data-brand="${this._esc(brand)}">${this._esc(brand)}</button>`;
    }).join('');

    grid.querySelectorAll('.brand-filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const brand = btn.dataset.brand;
        const current = store.get('prefs').selectedBrands;
        const next = current.includes(brand)
          ? current.filter(b => b !== brand)
          : [...current, brand];
        this._savePrefs({ selectedBrands: next });
        btn.classList.toggle('selected', next.includes(brand));
      });
    });
  }

  _renderGasTypes() {
    const row = this.querySelector('#gas-type-row');
    if (!row) return;
    const types = store.get('availableGasTypes');
    const selected = store.get('prefs').selectedGasTypes;
    row.innerHTML = types.map(type => {
      const isSelected = selected.includes(type);
      return `<button class="gas-pill ${isSelected ? 'selected' : ''}"
                data-type="${this._esc(type)}">${this._esc(type)}</button>`;
    }).join('');

    row.querySelectorAll('.gas-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        const current = store.get('prefs').selectedGasTypes;
        if (current.includes(type) && current.length === 1) return;
        const next = current.includes(type)
          ? current.filter(t => t !== type)
          : [...current, type];
        this._savePrefs({ selectedGasTypes: next });
        btn.classList.toggle('selected', next.includes(type));
      });
    });
  }

  _attachStaticListeners() {
    const slider = this.querySelector('#distance-slider');
    const label  = this.querySelector('#distance-val');
    slider?.addEventListener('input', e => {
      const val = Number(e.target.value);
      if (label) label.textContent = `${val} km`;
      this._savePrefs({ maxDistanceKm: val });
    });

    this.querySelectorAll('.seg-option').forEach(btn => {
      btn.addEventListener('click', () => {
        this.querySelectorAll('.seg-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._savePrefs({ sortBy: btn.dataset.sort });
      });
    });

    this.querySelector('#sheet-backdrop')?.addEventListener('click', () => {
      this._close();
    });
  }

  _savePrefs(partial) {
    const current = store.get('prefs');
    const next = { ...current, ...partial };
    store.set('prefs', next);
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  }

  _setOpen(open) {
    this.querySelector('.filter-sheet')?.classList.toggle('open', open);
    this.querySelector('.sheet-backdrop')?.classList.toggle('visible', open);
  }

  _close() {
    if (store.get('isFirstLaunch')) {
      store.set('isFirstLaunch', false);
      localStorage.setItem('gazradar_first_launch_done', '1');
    }
    store.set('filterSheetOpen', false);
  }
}

customElements.define('filter-sheet', FilterSheet);
