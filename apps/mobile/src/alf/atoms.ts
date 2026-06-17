/**
 * Atoms — small, static, reusable style objects, Tailwind-style.
 *
 * Usage:  <View style={[atoms.flex_row, atoms.gap_sm, atoms.p_lg]} />
 *
 * Only theme-independent values live here (layout, spacing, type). Colors come
 * from the theme (see theme.tsx) because they change between light/dark.
 */
import {StyleSheet} from 'react-native'

import {fontSize, fontWeight, radius, space} from './tokens'

export const atoms = StyleSheet.create({
  // flex / layout
  flex_1: {flex: 1},
  flex_row: {flexDirection: 'row'},
  flex_col: {flexDirection: 'column'},
  flex_wrap: {flexWrap: 'wrap'},
  align_center: {alignItems: 'center'},
  align_start: {alignItems: 'flex-start'},
  align_end: {alignItems: 'flex-end'},
  justify_center: {justifyContent: 'center'},
  justify_between: {justifyContent: 'space-between'},
  justify_end: {justifyContent: 'flex-end'},
  self_center: {alignSelf: 'center'},

  // gap
  gap_xs: {gap: space.xs},
  gap_sm: {gap: space.sm},
  gap_md: {gap: space.md},
  gap_lg: {gap: space.lg},
  gap_xl: {gap: space.xl},

  // padding
  p_sm: {padding: space.sm},
  p_md: {padding: space.md},
  p_lg: {padding: space.lg},
  p_xl: {padding: space.xl},
  px_md: {paddingHorizontal: space.md},
  px_lg: {paddingHorizontal: space.lg},
  px_xl: {paddingHorizontal: space.xl},
  py_sm: {paddingVertical: space.sm},
  py_md: {paddingVertical: space.md},
  py_lg: {paddingVertical: space.lg},
  py_xl: {paddingVertical: space.xl},

  // margin
  mt_sm: {marginTop: space.sm},
  mt_md: {marginTop: space.md},
  mt_lg: {marginTop: space.lg},
  mb_sm: {marginBottom: space.sm},
  mb_md: {marginBottom: space.md},

  // radius
  rounded_sm: {borderRadius: radius.sm},
  rounded_md: {borderRadius: radius.md},
  rounded_lg: {borderRadius: radius.lg},
  rounded_full: {borderRadius: radius.full},

  // typography
  text_xs: {fontSize: fontSize.xs, lineHeight: fontSize.xs * 1.4},
  text_sm: {fontSize: fontSize.sm, lineHeight: fontSize.sm * 1.4},
  text_md: {fontSize: fontSize.md, lineHeight: fontSize.md * 1.4},
  text_lg: {fontSize: fontSize.lg, lineHeight: fontSize.lg * 1.4},
  text_xl: {fontSize: fontSize.xl, lineHeight: fontSize.xl * 1.3},
  text_xxl: {fontSize: fontSize.xxl, lineHeight: fontSize.xxl * 1.2},
  font_normal: {fontWeight: fontWeight.normal},
  font_medium: {fontWeight: fontWeight.medium},
  font_semibold: {fontWeight: fontWeight.semibold},
  font_bold: {fontWeight: fontWeight.bold},
  text_center: {textAlign: 'center'},
})
