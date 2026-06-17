/**
 * Design tokens — the raw values everything else is built from.
 *
 * Inspired by Bluesky's ALF: Tailwind-like naming and "t-shirt" sizing
 * (xxs…xxl) instead of arbitrary pixel values, so spacing and type stay
 * consistent across the app. Self-contained — no external package needed.
 */

// Primary brand blue (Bluesky-family feel) + neutral gray scale.
export const palette = {
  white: '#FFFFFF',
  black: '#0B0F14',

  blue_25: '#EAF2FF',
  blue_50: '#D6E6FF',
  blue_100: '#A9CCFF',
  blue_300: '#59B9FF',
  blue_500: '#1085FE', // brand
  blue_600: '#0A7AFF',
  blue_700: '#054CFF',

  gray_0: '#FFFFFF',
  gray_50: '#F1F3F5',
  gray_100: '#E4E7EB',
  gray_200: '#CDD2D9',
  gray_300: '#AEB6C0',
  gray_400: '#8B95A1',
  gray_500: '#697282',
  gray_600: '#4C5563',
  gray_700: '#333B47',
  gray_800: '#20262E',
  gray_900: '#141A21',
  gray_950: '#0B0F14',

  green_500: '#1FA672',
  red_500: '#E5484D',
  yellow_500: '#F3A84C',
} as const

/** Spacing scale, in px. Used for padding, margin, gap. */
export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  '3xl': 48,
} as const

/** Type scale, in px. */
export const fontSize = {
  xxs: 11,
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
} as const

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const

/** Corner radius scale, in px. */
export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 999,
} as const

export type SpaceToken = keyof typeof space
export type FontSizeToken = keyof typeof fontSize
export type RadiusToken = keyof typeof radius
