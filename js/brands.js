const BRAND_COLORS = {
  'Shell':         { bg: '#FFD500', text: '#000000' },
  'Esso':          { bg: '#ED1C24', text: '#FFFFFF' },
  'Petro-Canada':  { bg: '#E31837', text: '#FFFFFF' },
  'Costco':        { bg: '#005596', text: '#FFFFFF' },
  'Ultramar':      { bg: '#005DAA', text: '#FFFFFF' },
  'Irving':        { bg: '#003DA5', text: '#FFFFFF' },
  'Canadian Tire': { bg: '#D62B2B', text: '#FFFFFF' },
  'Pioneer':       { bg: '#F7941D', text: '#000000' },
};

function hashBrand(str) {
  let hash = 0;
  for (const ch of str) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  const hue = Math.abs(hash) % 360;
  const text = (hue < 60 || hue > 200) ? '#000000' : '#FFFFFF';
  return { bg: `hsl(${hue}, 55%, 45%)`, text };
}

export function getBrandStyle(brand) {
  return BRAND_COLORS[brand] ?? hashBrand(brand);
}
