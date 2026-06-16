import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useData } from '../context/DataContext';
import { COLORS, SIZES, FONTS, SHADOWS } from '../utils/theme';
import Icon from '@expo/vector-icons/MaterialIcons';

export default function OnboardingScreen({ navigation }) {
  const { getTranslation } = useData();
  const [step, setStep] = useState(0);

  const slides = [
    {
      title: getTranslation('onboardingTitle1'),
      desc: getTranslation('onboardingDesc1'),
      icon: 'account-balance-wallet',
      color: '#0F8243',
    },
    {
      title: getTranslation('onboardingTitle2'),
      desc: getTranslation('onboardingDesc2'),
      icon: 'message',
      color: '#3B82F6',
    },
    {
      title: getTranslation('onboardingTitle3'),
      desc: getTranslation('onboardingDesc3'),
      icon: 'cloud-done',
      color: '#8B5CF6',
    },
  ];

  const currentSlide = slides[step];

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      navigation.navigate('ProfileSetup');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('ProfileSetup')} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Main Slide Content */}
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: currentSlide.color + '20' }]}>
          <Icon name={currentSlide.icon} size={64} color={currentSlide.color} />
        </View>
        <Text style={styles.title}>{currentSlide.title}</Text>
        <Text style={styles.desc}>{currentSlide.desc}</Text>
      </View>

      {/* Pagination Dot indicators */}
      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {slides.map((_, idx) => (
            <View 
              key={idx} 
              style={[
                styles.dot, 
                step === idx ? [styles.dotActive, { backgroundColor: currentSlide.color }] : styles.dotInactive
              ]} 
            />
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.nextBtn, { backgroundColor: currentSlide.color }]} 
          onPress={handleNext}
        >
          <Text style={styles.nextText}>
            {step === slides.length - 1 ? getTranslation('getStarted') : getTranslation('next')}
          </Text>
          <Icon name="arrow-forward" size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  header: {
    height: 50,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: SIZES.lg,
  },
  skipBtn: {
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.sm,
  },
  skipText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    textAlign: 'center',
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    ...SHADOWS.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    marginBottom: SIZES.md,
  },
  desc: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    paddingBottom: 40,
    paddingHorizontal: SIZES.lg,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 30,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
  },
  dotInactive: {
    width: 8,
    backgroundColor: COLORS.border,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 26,
    paddingHorizontal: 40,
    gap: 8,
    ...SHADOWS.md,
  },
  nextText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
