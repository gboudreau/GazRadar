const BRAND_COLORS = {
  'Shell':        { bg: '#FFD500', text: '#000000' },
  'Esso':         { bg: '#0033A0', text: '#FFFFFF' },
  'Petro-Canada': { bg: '#E1251B', text: '#FFFFFF' },
  'Ultramar':     { bg: '#005DAA', text: '#FFFFFF' },
  'Harnois':      { bg: '#E30613', text: '#FFFFFF' },
  'Irving':       { bg: '#006341', text: '#FFFFFF' },
  'Sonic':        { bg: '#F58220', text: '#FFFFFF' },
};

const DEFAULT_STYLE = { bg: '#E5E5EA', text: '#1C1C1E' };

export function getBrandStyle(brand) {
  return BRAND_COLORS[brand] ?? DEFAULT_STYLE;
}
