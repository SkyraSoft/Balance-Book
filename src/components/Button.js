import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SIZES, FONTS } from '../utils/theme';

export default function Button({
  title,
  onPress,
  type = 'primary', // 'primary', 'secondary', 'danger', 'success'
  disabled = false,
  loading = false,
  style,
  textStyle,
}) {
  let backgroundColor = COLORS.primary;
  let textColor = COLORS.white;

  if (type === 'secondary') {
    backgroundColor = COLORS.surface;
    textColor = COLORS.text;
  } else if (type === 'danger') {
    backgroundColor = COLORS.danger;
  } else if (type === 'success') {
    backgroundColor = COLORS.success;
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor },
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 50,
    borderRadius: SIZES.radiusXl, // Pill shape
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    flexDirection: 'row',
  },
  text: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.fontLg,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});
