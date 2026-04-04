import { store } from '../store.js';
import { geocode } from '../geo.js';

function _esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

class LocationPicker extends HTMLElement {
  _debounceTimer = null;
  _abortController = null;
  _results = [];
  _loading = false;
  _error = null;

  connectedCallback() {
    this._buildShell();
    this._unsubs = [
      store.subscribe('locationPickerOpen', open => {
        this._setOpen(open);
      }),
    ];
  }

  disconnectedCallback() {
    this._unsubs?.forEach(u => u());
  }

  _buildShell() {
    this.innerHTML = `
      <div class="sheet-backdrop picker-backdrop"></div>
      <div class="filter-sheet picker-sheet" role="dialog" aria-modal="true" aria-label="Choisir une position">
        <div class="sheet-handle"></div>
        <div class="picker-header">
          <span class="picker-title">Choisir une position</span>
          <button class="picker-close-btn" aria-label="Fermer">✕</button>
        </div>
        <div class="picker-search-wrap">
          <span class="picker-search-icon">🔍</span>
          <input
            class="picker-search-input"
            type="search"
            placeholder="Ville, adresse…"
            autocomplete="off"
            autocorrect="off"
            spellcheck="false"
          />
        </div>
        <button class="picker-my-location-btn">
          <span>📍</span> Utiliser ma position actuelle
        </button>
        <div class="picker-results"></div>
      </div>`;

    this.querySelector('.picker-backdrop').addEventListener('click', () => this._close());
    this.querySelector('.picker-close-btn').addEventListener('click', () => this._close());
    this.querySelector('.picker-my-location-btn').addEventListener('click', () => this._useMyLocation());
    this.querySelector('.picker-search-input').addEventListener('input', e => this._onInput(e));
  }

  _setOpen(open) {
    const backdrop = this.querySelector('.picker-backdrop');
    const sheet    = this.querySelector('.picker-sheet');
    if (!backdrop || !sheet) return;

    if (open) {
      backdrop.classList.add('visible');
      sheet.classList.add('open');
      // Clear previous state
      this._results = [];
      this._error   = null;
      this._renderResults();
      const input = this.querySelector('.picker-search-input');
      if (input) { input.value = ''; input.focus(); }
    } else {
      backdrop.classList.remove('visible');
      sheet.classList.remove('open');
      this._abortController?.abort();
    }
  }

  _close() {
    store.set('locationPickerOpen', false);
  }

  _useMyLocation() {
    store.set('customLocation', null);
    this._close();
  }

  _onInput(e) {
    clearTimeout(this._debounceTimer);
    const q = e.target.value.trim();
    if (!q) {
      this._results = [];
      this._error   = null;
      this._loading  = false;
      this._renderResults();
      return;
    }
    this._loading = true;
    this._renderResults();
    this._debounceTimer = setTimeout(() => this._search(q), 320);
  }

  async _search(query) {
    this._abortController?.abort();
    this._abortController = new AbortController();

    try {
      const results = await geocode(query);
      this._results = results;
      this._error   = null;
    } catch (err) {
      if (err.name !== 'AbortError') {
        this._error   = 'Impossible d\'obtenir les résultats. Vérifiez votre connexion.';
        this._results = [];
      }
    } finally {
      this._loading = false;
      this._renderResults();
    }
  }

  _renderResults() {
    const container = this.querySelector('.picker-results');
    if (!container) return;

    if (this._loading) {
      container.innerHTML = `<div class="picker-status">Recherche…</div>`;
      return;
    }
    if (this._error) {
      container.innerHTML = `<div class="picker-status picker-status-error">${_esc(this._error)}</div>`;
      return;
    }
    if (!this._results.length) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = this._results.map((r, i) => `
      <button class="picker-result-item" data-index="${i}">
        <span class="picker-result-icon">📍</span>
        <span class="picker-result-label">${_esc(r.label)}</span>
      </button>`).join('');

    container.querySelectorAll('.picker-result-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.index);
        const r   = this._results[idx];
        if (r) {
          store.set('customLocation', { lat: r.lat, lng: r.lng, label: r.label });
          this._close();
        }
      });
    });
  }
}

customElements.define('location-picker', LocationPicker);
