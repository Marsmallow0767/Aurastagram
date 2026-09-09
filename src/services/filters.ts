export interface InstagramFilter {
  id: string;
  name: string;
  css: string;
}

export const INSTAGRAM_FILTERS: InstagramFilter[] = [
  { id: 'normal', name: 'Normal', css: 'none' },
  { id: 'clarendon', name: 'Clarendon', css: 'contrast(1.2) saturate(1.25) brightness(1.05)' },
  { id: 'gingham', name: 'Gingham', css: 'brightness(1.05) hue-rotate(-10deg) contrast(0.9)' },
  { id: 'juno', name: 'Juno', css: 'contrast(1.15) saturate(1.4) brightness(1.05)' },
  { id: 'lark', name: 'Lark', css: 'contrast(0.9) saturate(1.3) brightness(1.1)' },
  { id: 'ludwig', name: 'Ludwig', css: 'contrast(1.05) saturate(1.1) brightness(1.05)' },
  { id: 'moon', name: 'Moon', css: 'grayscale(1) contrast(1.1) brightness(1.1)' },
  { id: 'valencia', name: 'Valencia', css: 'contrast(1.08) brightness(1.08) sepia(0.25)' },
  { id: 'slumber', name: 'Slumber', css: 'saturate(0.66) brightness(1.05) sepia(0.35)' },
  { id: 'lofi', name: 'Lo-Fi', css: 'contrast(1.5) saturate(1.1)' },
  { id: 'xpro2', name: 'X-Pro II', css: 'contrast(1.3) saturate(1.25) sepia(0.3)' },
  { id: 'noir', name: 'Noir', css: 'grayscale(1) contrast(1.6) brightness(0.9)' },
];

export function getFilterCss(filterId?: string): string {
  if (!filterId) return 'none';
  const filter = INSTAGRAM_FILTERS.find(f => f.id === filterId);
  return filter ? filter.css : 'none';
}
