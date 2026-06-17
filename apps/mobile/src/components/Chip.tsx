/**
 * Chip — a selectable pill. Used for language and interest selection.
 */
import React from 'react'
import {Pressable} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Text'

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string
  selected: boolean
  onPress: () => void
}) {
  const t = useTheme()
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [
        a.px_lg,
        a.py_sm,
        a.rounded_full,
        {
          backgroundColor: selected ? t.palette.primary : t.palette.surface,
          borderWidth: 1,
          borderColor: selected ? t.palette.primary : t.palette.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <Text variant="label" style={{color: selected ? t.palette.onPrimary : t.palette.text}}>
        {label}
      </Text>
    </Pressable>
  )
}
