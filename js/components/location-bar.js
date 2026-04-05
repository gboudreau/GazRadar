import { store } from '../store.js';

function _esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

class LocationBar extends HTMLElement {
  connectedCallback() {
    this._unsubs = [
      store.subscribe('customLocation',        () => this._render()),
      store.subscribe('locationStatus',         () => this._render()),
      store.subscribe('userLocationUpdatedAt',  () => this._render()),
    ];
    this._render();
    this.addEventListener('click', this._onClick.bind(this));
  }

  disconnectedCallback() {
    this._unsubs?.forEach(u => u());
  }

  _render() {
    const custom = store.get('customLocation');
    const status = store.get('locationStatus');

    let label, clearable;
    if (custom) {
      label     = custom.label;
      clearable = true;
    } else if (status === 'pending') {
      label     = 'Localisation…';
      clearable = false;
    } else if (status === 'granted') {
      const updatedAt = store.get('userLocationUpdatedAt');
      const timeStr   = updatedAt
        ? new Date(updatedAt).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })
        : null;
      label     = timeStr ? `Ma position · ${timeStr}` : 'Ma position actuelle';
      clearable = false;
    } else {
      label     = 'Position inconnue';
      clearable = false;
    }

    this.innerHTML = `
      <div class="location-bar">
        <button class="location-bar-btn" aria-label="Changer de position de recherche">
          <span class="location-bar-icon">📍</span>
          <span class="location-bar-label">${_esc(label)}</span>
          <span class="location-bar-chevron">›</span>
        </button>
        ${clearable
          ? `<button class="location-bar-clear" aria-label="Effacer la position personnalisée">✕</button>`
          : ''}
      </div>`;
  }

  _onClick(e) {
    if (e.target.closest('.location-bar-clear')) {
      store.set('customLocation', null);
    } else if (e.target.closest('.location-bar-btn')) {
      store.set('locationPickerOpen', true);
    }
  }
}

customElements.define('location-bar', LocationBar);
