const _state = {
  prefs: {
    selectedBrands: [],
    selectedGasTypes: ['Régulier'],
    maxDistanceKm: 10,
    sortBy: 'price',
  },
  stations: [],
  filteredStations: [],
  availableBrands: [],
  availableGasTypes: [],
  brandExcludedCount: 0,
  userLocation: null,
  userLocationUpdatedAt: null,
  locationStatus: 'pending',
  dataStatus: 'idle',
  generatedAt: null,
  lastFetchedAt: null,
  filterSheetOpen: false,
  locationPickerOpen: false,
  customLocation: null,
  isFirstLaunch: true,
  initialized: false,  // guard to prevent premature execution
};

const _subscribers = {};

function subscribe(key, handler) {
  if (!_subscribers[key]) _subscribers[key] = new Set();
  _subscribers[key].add(handler);
  return () => _subscribers[key].delete(handler);
}

function set(key, value) {
  _state[key] = value;
  if (_subscribers[key]) {
    for (const handler of _subscribers[key]) handler(value);
  }
}

function get(key) {
  return _state[key];
}

export const store = { subscribe, set, get };
