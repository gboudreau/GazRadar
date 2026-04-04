import { store } from '../store.js';

class AppHeader extends HTMLElement {
  connectedCallback() {
    this._unsubs = [
      store.subscribe('dataStatus', () => this._render()),
      store.subscribe('generatedAt', () => this._render()),
      store.subscribe('lastFetchedAt', () => this._render()),
    ];
    window.addEventListener('online', this._onNetworkChange);
    window.addEventListener('offline', this._onNetworkChange);
    this._render();
  }

  disconnectedCallback() {
    this._unsubs?.forEach(u => u());
    window.removeEventListener('online', this._onNetworkChange);
    window.removeEventListener('offline', this._onNetworkChange);
  }

  _onNetworkChange = () => this._render();

  _fmt(ts) {
    if (!ts) return '—';
    return new Date(ts).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
  }

  _render() {
    const dataStatus   = store.get('dataStatus');
    const generatedAt  = store.get('generatedAt');
    const lastFetchedAt = store.get('lastFetchedAt');
    const isLoading    = dataStatus === 'loading';

    this.innerHTML = `
      <div class="app-header">
        <div class="header-row">
          <span class="app-title">⛽ GazRadar</span>
          <div class="header-actions">
            ${!navigator.onLine ? '<span class="offline-badge">Offline</span>' : ''}
            <button class="refresh-btn" ${isLoading ? 'disabled' : ''} aria-label="Rafraîchir">
              <span class="${isLoading ? 'spin' : ''}">↻</span>
            </button>
          </div>
        </div>
        <div class="meta-row">Mis à jour: ${this._fmt(lastFetchedAt)} · Source: ${this._fmt(generatedAt)}</div>
      </div>
    `;

    this.querySelector('.refresh-btn')?.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('gazradar:refresh'));
    });
  }
}

customElements.define('app-header', AppHeader);
