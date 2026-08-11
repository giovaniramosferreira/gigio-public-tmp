export type StyleId = 'dark-gold' | 'neon' | 'sunset' | 'minimal'

export interface SlideStyle {
  id: StyleId
  name: string
  description: string
  preview: string // CSS gradient for thumbnail
  coverOverlay: string
  contentOverlay: string
  ctaOverlay: string
  coverFallback: string
  contentFallback: string
  ctaFallback: string
  accentColor: string
  titleColor: string
  contentColor: string
  counterBg: string
  counterColor: string
  // For ZIP download
  accentHex: string
}

export const STYLES: Record<StyleId, SlideStyle> = {
  'dark-gold': {
    id: 'dark-gold',
    name: 'Dark Gold',
    description: 'Preto & dourado — premium e sofisticado',
    preview: 'linear-gradient(135deg, #0a0a0a 0%, #1a1200 50%, #0a0a0a 100%)',
    coverOverlay:   'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(30,18,0,0.55), rgba(0,0,0,0.80))',
    contentOverlay: 'linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0.45), rgba(0,0,0,0.68))',
    ctaOverlay:     'linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.88))',
    coverFallback:   'linear-gradient(135deg, #0a0a0a, #1c1200)',
    contentFallback: 'linear-gradient(135deg, #111, #1a1800)',
    ctaFallback:     '#0a0a0a',
    accentColor: '#FFD000',
    titleColor:  '#ffffff',
    contentColor: 'rgba(255,255,255,0.88)',
    counterBg:   'rgba(0,0,0,0.5)',
    counterColor: 'rgba(255,255,255,0.65)',
    accentHex: '#FFD000',
  },
  'neon': {
    id: 'neon',
    name: 'Neon Cyber',
    description: 'Azul elétrico & preto — tech e futurista',
    preview: 'linear-gradient(135deg, #050d1a 0%, #001233 50%, #050d1a 100%)',
    coverOverlay:   'linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,18,60,0.55), rgba(0,0,0,0.80))',
    contentOverlay: 'linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,10,30,0.45), rgba(0,0,0,0.68))',
    ctaOverlay:     'linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,5,20,0.90))',
    coverFallback:   'linear-gradient(135deg, #050d1a, #001233)',
    contentFallback: 'linear-gradient(135deg, #060d1a, #001030)',
    ctaFallback:     '#030912',
    accentColor: '#00d4ff',
    titleColor:  '#ffffff',
    contentColor: 'rgba(255,255,255,0.88)',
    counterBg:   'rgba(0,0,0,0.5)',
    counterColor: 'rgba(255,255,255,0.65)',
    accentHex: '#00d4ff',
  },
  'sunset': {
    id: 'sunset',
    name: 'Sunset Vibes',
    description: 'Laranja & roxo — vibrante e criativo',
    preview: 'linear-gradient(135deg, #1a0a00 0%, #3d0d00 40%, #1a001a 100%)',
    coverOverlay:   'linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(80,20,0,0.45), rgba(40,0,40,0.75))',
    contentOverlay: 'linear-gradient(to bottom, rgba(0,0,0,0.20), rgba(60,15,0,0.40), rgba(20,0,20,0.65))',
    ctaOverlay:     'linear-gradient(to bottom, rgba(0,0,0,0.50), rgba(40,5,40,0.88))',
    coverFallback:   'linear-gradient(135deg, #1a0a00, #3d0d00, #1a001a)',
    contentFallback: 'linear-gradient(135deg, #150800, #300a00)',
    ctaFallback:     'linear-gradient(135deg, #100010, #1a0800)',
    accentColor: '#ff6b35',
    titleColor:  '#ffffff',
    contentColor: 'rgba(255,255,255,0.88)',
    counterBg:   'rgba(0,0,0,0.5)',
    counterColor: 'rgba(255,255,255,0.65)',
    accentHex: '#ff6b35',
  },
  'minimal': {
    id: 'minimal',
    name: 'Minimal White',
    description: 'Branco & cinza — clean e editorial',
    preview: 'linear-gradient(135deg, #f8f8f8 0%, #e8e8e8 100%)',
    coverOverlay:   'linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(0,0,0,0.35), rgba(0,0,0,0.70))',
    contentOverlay: 'linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(0,0,0,0.25), rgba(0,0,0,0.55))',
    ctaOverlay:     'linear-gradient(to bottom, rgba(0,0,0,0.40), rgba(0,0,0,0.82))',
    coverFallback:   'linear-gradient(135deg, #2a2a2a, #111)',
    contentFallback: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
    ctaFallback:     '#111111',
    accentColor: '#222222',
    titleColor:  '#ffffff',
    contentColor: 'rgba(255,255,255,0.88)',
    counterBg:   'rgba(0,0,0,0.4)',
    counterColor: 'rgba(255,255,255,0.65)',
    accentHex: '#222222',
  },
}

export const STYLE_LIST = Object.values(STYLES)

export function getStyle(id?: string | null): SlideStyle {
  return STYLES[(id as StyleId) ?? 'dark-gold'] ?? STYLES['dark-gold']
}
