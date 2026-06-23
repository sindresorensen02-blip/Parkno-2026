import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { PrimaryButton } from '../components/Primitives';
import { colors, radii, spacing, shadow, typography } from '../theme';
import { usePremium } from '../context/PremiumContext';
import {
  PLANS, DEFAULT_PLAN_ID, BENEFITS, FAQ, TRIAL, COPY,
  TIMELINE_WITH_TRIAL, TIMELINE_NO_TRIAL,
  getPlan, getCtaLabel, getBillingSummary, formatPrice,
  PREMIUM_EVENTS, trackPremiumEvent,
} from '../constants/premium';

const TIMELINE = TRIAL.enabled ? TIMELINE_WITH_TRIAL : TIMELINE_NO_TRIAL;

export default function ParknoPremiumScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { isPremium, setIsPremium } = usePremium();
  const [selectedPlanId, setSelectedPlanId] = useState(DEFAULT_PLAN_ID);
  const [openFaq, setOpenFaq] = useState(null);

  const selectedPlan = getPlan(selectedPlanId);

  useEffect(() => {
    trackPremiumEvent(PREMIUM_EVENTS.PAGE_VIEWED, { isPremium });
    // Trial/billing explanation is part of the initial viewport on this page.
    trackPremiumEvent(PREMIUM_EVENTS.TRIAL_INFO_VIEWED, { trialEnabled: TRIAL.enabled });
  }, [isPremium]);

  const selectPlan = useCallback((planId) => {
    setSelectedPlanId(planId);
    trackPremiumEvent(PREMIUM_EVENTS.PLAN_SELECTED, { planId });
  }, []);

  const handlePurchase = useCallback(() => {
    trackPremiumEvent(PREMIUM_EVENTS.CTA_CLICKED, { planId: selectedPlan.id });
    trackPremiumEvent(PREMIUM_EVENTS.PURCHASE_STARTED, {
      planId: selectedPlan.id,
      productId: selectedPlan.productId,
      price: selectedPlan.priceAmount,
    });

    // TODO(billing): replace with the real StoreKit / Google Play / RevenueCat
    // purchase flow for `selectedPlan.productId`. On a verified purchase, call
    // setIsPremium(true). Until that exists we use the app's existing in-memory
    // unlock (the same mechanism ProfileScreen/BetalingPaakrevd already use) so
    // premium features actually toggle — NO fake payment UI is shown.
    setIsPremium(true);
    Alert.alert(
      'Parkno Premium aktivert',
      'Premium er nå aktivt på kontoen din. Du kan si opp når som helst.',
      [{ text: 'Flott', onPress: () => navigation.goBack() }],
    );
  }, [selectedPlan, setIsPremium, navigation]);

  const openPrivacy = () => navigation.navigate('Personvern');

  // ── Already premium: calm "you're in" state ────────────────────────────────
  if (isPremium) {
    return (
      <View style={s.root}>
        <ScrollView contentContainerStyle={[s.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}>
          <Header navigation={navigation} />
          <View style={s.activeCard}>
            <LinearGradient
              colors={['#10B981', '#14B8A6', '#2563EB']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFillObject, { borderRadius: radii.card }]}
            />
            <Image source={require('../../assets/parkno-logo.png')} style={s.activeLogo} resizeMode="contain" />
            <Text style={s.activeEyebrow}>AKTIV</Text>
            <Text style={s.activeTitle}>Parkno Premium er aktivt</Text>
            <Text style={s.activeSub}>
              Du slipper bookingavgiften på alle reservasjoner. {COPY.cancelReassurance}.
            </Text>
          </View>

          <Text style={s.sectionTitle} accessibilityRole="header">{COPY.benefitsTitle}</Text>
          {BENEFITS.map((b) => <BenefitRow key={b.title} benefit={b} />)}
        </ScrollView>
      </View>
    );
  }

  // ── Paywall ────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={[s.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 150 }]}
        showsVerticalScrollIndicator={false}
      >
        <Header navigation={navigation} />

        {/* Hero */}
        <View style={s.hero}>
          <LinearGradient
            colors={['#10B981', '#14B8A6', '#2563EB']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: radii.hero }]}
          />
          <View style={s.heroOrb} />
          <Image source={require('../../assets/parkno-logo.png')} style={s.heroLogo} resizeMode="contain" />
          <Text style={s.heroEyebrow}>{COPY.eyebrow}</Text>
          <Text style={s.heroTitle} accessibilityRole="header">{COPY.heroTitle}</Text>
          <Text style={s.heroSubtitle}>{COPY.heroSubtitle}</Text>
        </View>

        {/* Benefits */}
        <Text style={s.sectionTitle} accessibilityRole="header">{COPY.benefitsTitle}</Text>
        <View style={s.benefitsWrap}>
          {BENEFITS.map((b) => <BenefitRow key={b.title} benefit={b} />)}
        </View>

        {/* Plans (weekly first / default selected) */}
        <Text style={s.sectionTitle} accessibilityRole="header">{COPY.plansTitle}</Text>
        <View style={s.plans}>
          {PLANS.map((plan) => {
            const selected = plan.id === selectedPlanId;
            return (
              <TouchableOpacity
                key={plan.id}
                activeOpacity={0.9}
                onPress={() => selectPlan(plan.id)}
                style={[s.planCard, selected && s.planCardSelected]}
                accessibilityRole="button"
                accessibilityLabel={`${plan.name}, ${formatPrice(plan.priceAmount)} ${plan.cadenceLabel}. ${plan.valueLine}`}
                accessibilityState={{ selected }}
              >
                <View style={s.planTop}>
                  <View style={s.planRadio}>
                    {selected && <View style={s.planRadioDot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={s.planNameRow}>
                      <Text style={s.planName}>{plan.name}</Text>
                      {plan.badge && (
                        <View style={[s.planBadge, selected && s.planBadgeSelected]}>
                          <Text style={[s.planBadgeText, selected && s.planBadgeTextSelected]}>{plan.badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={s.planValue}>{plan.valueLine}</Text>
                  </View>
                  <View style={s.planPriceWrap}>
                    <Text style={s.planPrice}>{formatPrice(plan.priceAmount)}</Text>
                    <Text style={s.planCadence}>{plan.cadenceLabel}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Honest trial / billing timeline */}
        <Text style={s.sectionTitle} accessibilityRole="header">{COPY.timelineTitle}</Text>
        <View style={s.timeline}>
          {TIMELINE.map((step, i) => (
            <View key={step.title} style={s.timelineRow}>
              <View style={s.timelineRail}>
                <View style={s.timelineDot}>
                  <Icon name={step.icon} size={14} color={colors.accentBlue} strokeWidth={2.2} />
                </View>
                {i < TIMELINE.length - 1 && <View style={s.timelineLine} />}
              </View>
              <View style={s.timelineText}>
                <Text style={s.timelineTitle}>{step.title}</Text>
                <Text style={s.timelineBody}>{step.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* FAQ */}
        <Text style={s.sectionTitle} accessibilityRole="header">{COPY.faqTitle}</Text>
        <View style={s.faqWrap}>
          {FAQ.map((item, i) => {
            const open = openFaq === i;
            return (
              <TouchableOpacity
                key={item.q}
                activeOpacity={0.8}
                onPress={() => setOpenFaq(open ? null : i)}
                style={s.faqItem}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                accessibilityLabel={item.q}
              >
                <View style={s.faqQRow}>
                  <Text style={s.faqQ}>{item.q}</Text>
                  <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.fg3} strokeWidth={2.2} />
                </View>
                {open && <Text style={s.faqA}>{item.a}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={s.legal}>
          Abonnementet fornyes automatisk. {COPY.cancelReassurance}.{' '}
          <Text style={s.legalLink} onPress={openPrivacy} accessibilityRole="link">
            Se personvern
          </Text>
          .
        </Text>
      </ScrollView>

      {/* Sticky bottom CTA with billing terms visible (not hidden in fine print) */}
      <View style={[s.ctaBar, { paddingBottom: insets.bottom + 12 }]}>
        <LinearGradient
          colors={['rgba(247,247,242,0)', '#F7F7F2']}
          style={s.ctaFade}
          pointerEvents="none"
        />
        <Text style={s.billingSummary}>{getBillingSummary(selectedPlan)}</Text>
        <PrimaryButton
          full
          onPress={handlePurchase}
          icon={<Icon name="arrow-right" size={16} color="#fff" strokeWidth={2.4} />}
          style={s.ctaBtn}
        >
          {getCtaLabel(selectedPlan)}
        </PrimaryButton>
      </View>
    </View>
  );
}

function Header({ navigation }) {
  return (
    <View style={s.header}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={s.backBtn}
        accessibilityRole="button"
        accessibilityLabel="Tilbake"
      >
        <Icon name="arrow-left" size={20} color={colors.fg1} />
      </TouchableOpacity>
      <Text style={s.headerTitle}>Parkno Premium</Text>
      <View style={s.backBtn} />
    </View>
  );
}

function BenefitRow({ benefit }) {
  return (
    <View style={s.benefit}>
      <View style={s.benefitIcon}>
        <Icon name={benefit.icon} size={18} color={colors.accentBlue} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.benefitTitle}>{benefit.title}</Text>
        <Text style={s.benefitBody}>{benefit.body}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgApp },
  content: { paddingHorizontal: spacing.s5 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing.s5,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.h3, color: colors.fg1 },

  // Hero
  hero: {
    borderRadius: radii.hero,
    padding: spacing.s6,
    overflow: 'hidden',
    marginBottom: spacing.s7,
    ...shadow(3),
  },
  heroOrb: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.12)', top: -70, right: -50,
  },
  heroLogo: { width: 48, height: 48, tintColor: '#fff', marginBottom: spacing.s4 },
  heroEyebrow: { ...typography.overline, color: 'rgba(255,255,255,0.8)' },
  heroTitle: { ...typography.h1, color: '#fff', marginTop: spacing.s2 },
  heroSubtitle: {
    ...typography.bodyMd, color: 'rgba(255,255,255,0.85)', marginTop: spacing.s3,
  },

  sectionTitle: { ...typography.h2, color: colors.fg1, marginBottom: spacing.s4 },

  // Benefits
  benefitsWrap: { gap: spacing.s3, marginBottom: spacing.s7 },
  benefit: {
    flexDirection: 'row', gap: spacing.s3, alignItems: 'flex-start',
    backgroundColor: colors.bgCardSolid,
    borderRadius: radii.md,
    padding: spacing.s4,
    borderWidth: 1, borderColor: 'rgba(17,20,22,0.05)',
  },
  benefitIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(78,167,185,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  benefitTitle: { ...typography.h3, fontSize: 15, color: colors.fg1 },
  benefitBody: { ...typography.caption, color: colors.fg3, marginTop: 2 },

  // Plans
  plans: { gap: spacing.s3, marginBottom: spacing.s7 },
  planCard: {
    backgroundColor: colors.bgCardSolid,
    borderRadius: radii.md,
    padding: spacing.s4,
    borderWidth: 2, borderColor: 'rgba(17,20,22,0.08)',
  },
  planCardSelected: {
    borderColor: colors.accentBlue,
    backgroundColor: '#FFFFFF',
    ...shadow(2),
  },
  planTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.s3 },
  planRadio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: 'rgba(17,20,22,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  planRadioDot: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: colors.accentBlue,
  },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.s2 },
  planName: { ...typography.h3, fontSize: 16, color: colors.fg1 },
  planValue: { ...typography.caption, color: colors.fg3, marginTop: 2 },
  planBadge: {
    backgroundColor: 'rgba(17,20,22,0.06)',
    borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 3,
  },
  planBadgeSelected: { backgroundColor: 'rgba(78,167,185,0.16)' },
  planBadgeText: { fontFamily: 'System', fontWeight: '700', fontSize: 10, color: colors.fg2, letterSpacing: 0.4 },
  planBadgeTextSelected: { color: colors.accentBlue },
  planPriceWrap: { alignItems: 'flex-end' },
  planPrice: { ...typography.price, color: colors.fg1 },
  planCadence: { ...typography.caption, color: colors.fg3, marginTop: 1 },

  // Timeline
  timeline: { marginBottom: spacing.s7 },
  timelineRow: { flexDirection: 'row', gap: spacing.s3 },
  timelineRail: { alignItems: 'center', width: 32 },
  timelineDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(78,167,185,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  timelineLine: { width: 2, flex: 1, minHeight: 18, backgroundColor: 'rgba(78,167,185,0.25)', marginVertical: 2 },
  timelineText: { flex: 1, paddingBottom: spacing.s4 },
  timelineTitle: { ...typography.h3, fontSize: 15, color: colors.fg1 },
  timelineBody: { ...typography.caption, color: colors.fg3, marginTop: 2 },

  // FAQ
  faqWrap: { gap: spacing.s2, marginBottom: spacing.s5 },
  faqItem: {
    backgroundColor: colors.bgCardSolid,
    borderRadius: radii.md,
    padding: spacing.s4,
    borderWidth: 1, borderColor: 'rgba(17,20,22,0.05)',
  },
  faqQRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.s3 },
  faqQ: { ...typography.h3, fontSize: 15, color: colors.fg1, flex: 1 },
  faqA: { ...typography.callout, color: colors.fg2, marginTop: spacing.s3 },

  legal: {
    ...typography.caption, color: colors.fg3, textAlign: 'center',
    marginBottom: spacing.s5, paddingHorizontal: spacing.s4,
  },
  legalLink: { color: colors.accentBlue, fontWeight: '600' },

  // Sticky CTA
  ctaBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: spacing.s5, paddingTop: spacing.s4,
    backgroundColor: '#F7F7F2',
  },
  ctaFade: {
    position: 'absolute', left: 0, right: 0, top: -28, height: 28,
  },
  billingSummary: {
    ...typography.caption, color: colors.fg2,
    textAlign: 'center', marginBottom: spacing.s3,
  },
  ctaBtn: { backgroundColor: colors.charcoal },

  // Already-premium state
  activeCard: {
    borderRadius: radii.card, padding: spacing.s6, overflow: 'hidden',
    marginBottom: spacing.s7, ...shadow(3),
  },
  activeLogo: { width: 44, height: 44, tintColor: '#fff', marginBottom: spacing.s3 },
  activeEyebrow: { ...typography.overline, color: 'rgba(255,255,255,0.8)' },
  activeTitle: { ...typography.h2, color: '#fff', marginTop: spacing.s2 },
  activeSub: { ...typography.callout, color: 'rgba(255,255,255,0.85)', marginTop: spacing.s2 },
});
