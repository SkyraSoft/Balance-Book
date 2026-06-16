import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useData } from '../context/DataContext';
import { COLORS, SIZES, FONTS, SHADOWS } from '../utils/theme';
import Header from '../components/Header';
import Icon from '@expo/vector-icons/MaterialIcons';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, G, Line } from 'react-native-svg';

export default function WeeklyTrendScreen({ navigation }) {
  const { transactions, getCurrencySymbol, getTranslation } = useData();
  const [activeWeekIdx, setActiveWeekIdx] = useState(1); // Default to "This Week" (index 1)

  // Calculate Weekly Trend Data (4 weeks: Previous, Current, Next, Week +2)
  const calculateWeeklyTrend = () => {
    const today = new Date();
    
    const getWeekRange = (offsetWeeks) => {
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay() + 1 + (offsetWeeks * 7)); // Monday start
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    };

    const prevRange = getWeekRange(-1);
    const currRange = getWeekRange(0);
    const next1Range = getWeekRange(1);
    const next2Range = getWeekRange(2);

    const filterTxsByRange = (start, end) => {
      return transactions.filter(t => {
        const d = new Date(t.date);
        return d >= start && d <= end;
      });
    };

    const prevTxs = filterTxsByRange(prevRange.start, prevRange.end);
    const currTxs = filterTxsByRange(currRange.start, currRange.end);
    
    const prevGave = prevTxs.filter(t => t.type === 'gave').reduce((s, t) => s + t.amount, 0);
    const prevGot = prevTxs.filter(t => t.type === 'got').reduce((s, t) => s + t.amount, 0);

    const currGave = currTxs.filter(t => t.type === 'gave').reduce((s, t) => s + t.amount, 0);
    const currGot = currTxs.filter(t => t.type === 'got').reduce((s, t) => s + t.amount, 0);

    // Coming weeks due balances
    const getDueForRange = (start, end) => {
      return transactions.filter(t => {
        if (t.type !== 'gave' || t.status !== 'pending' || !t.dueDate) return false;
        const d = new Date(t.dueDate);
        return d >= start && d <= end;
      }).reduce((s, t) => s + t.amount, 0);
    };

    const coming1Due = getDueForRange(next1Range.start, next1Range.end);
    const coming2Due = getDueForRange(next2Range.start, next2Range.end);

    // Projections
    const next1Gave = Math.round(currGave * 0.9);
    const next1Got = Math.round(coming1Due + (currGot * 0.8));

    const next2Gave = Math.round(currGave * 0.85);
    const next2Got = Math.round(coming2Due + (currGot * 0.75));

    return [
      { 
        label: 'Prev Week', 
        gave: prevGave, 
        got: prevGot, 
        isForecast: false,
        rangeLabel: `${prevRange.start.toLocaleDateString([], {day: 'numeric', month: 'short'})} - ${prevRange.end.toLocaleDateString([], {day: 'numeric', month: 'short'})}`,
        txCount: prevTxs.length
      },
      { 
        label: 'This Week', 
        gave: currGave, 
        got: currGot, 
        isForecast: false,
        rangeLabel: `${currRange.start.toLocaleDateString([], {day: 'numeric', month: 'short'})} - ${currRange.end.toLocaleDateString([], {day: 'numeric', month: 'short'})}`,
        txCount: currTxs.length
      },
      { 
        label: 'Next Week', 
        gave: next1Gave, 
        got: next1Got, 
        isForecast: true,
        rangeLabel: `${next1Range.start.toLocaleDateString([], {day: 'numeric', month: 'short'})} - ${next1Range.end.toLocaleDateString([], {day: 'numeric', month: 'short'})}`,
        txCount: 'Forecast'
      },
      { 
        label: 'Week +2', 
        gave: next2Gave, 
        got: next2Got, 
        isForecast: true,
        rangeLabel: `${next2Range.start.toLocaleDateString([], {day: 'numeric', month: 'short'})} - ${next2Range.end.toLocaleDateString([], {day: 'numeric', month: 'short'})}`,
        txCount: 'Forecast'
      },
    ];
  };

  const trendData = calculateWeeklyTrend();
  const activeWeek = trendData[activeWeekIdx];

  // SVG dimensions
  const screenWidth = Dimensions.get('window').width - 32;
  const chartHeight = 220;
  const paddingX = 30;
  const paddingY = 30;
  
  const bottomY = chartHeight - paddingY;
  const maxVal = Math.max(...trendData.flatMap(d => [d.gave, d.got]), 1000);

  // Map data to SVG points
  const pointsGave = trendData.map((d, i) => {
    const x = paddingX + (i * (screenWidth - 2 * paddingX) / 3);
    const y = bottomY - (d.gave / maxVal) * (chartHeight - 2 * paddingY);
    return { x, y };
  });

  const pointsGot = trendData.map((d, i) => {
    const x = paddingX + (i * (screenWidth - 2 * paddingX) / 3);
    const y = bottomY - (d.got / maxVal) * (chartHeight - 2 * paddingY);
    return { x, y };
  });

  // Curved path generators
  const getCurvePath = (points) => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
      const cpY2 = p1.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const getAreaPath = (points) => {
    const curve = getCurvePath(points);
    if (!curve) return '';
    return `${curve} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;
  };

  const currencySymbol = getCurrencySymbol();
  const netInflow = activeWeek.got - activeWeek.gave;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <Header />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Chart Visual Card */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>Continuous Ledger Trend</Text>
          <Text style={styles.cardSubtitle}>Compare credit lent (Gave) against cash payments received (Got).</Text>

          <View style={styles.svgContainer}>
            <Svg width={screenWidth} height={chartHeight}>
              <Defs>
                <LinearGradient id="gradGave" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={COLORS.danger} stopOpacity="0.3" />
                  <Stop offset="1" stopColor={COLORS.danger} stopOpacity="0.0" />
                </LinearGradient>
                <LinearGradient id="gradGot" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={COLORS.success} stopOpacity="0.3" />
                  <Stop offset="1" stopColor={COLORS.success} stopOpacity="0.0" />
                </LinearGradient>
              </Defs>

              {/* Grid Lines */}
              <Line x1={paddingX} y1={bottomY} x2={screenWidth - paddingX} y2={bottomY} stroke="#E2E8F0" strokeWidth={1} />
              <Line x1={paddingX} y1={paddingY} x2={screenWidth - paddingX} y2={paddingY} stroke="#F1F5F9" strokeWidth={1} />
              
              {/* Draw Areas */}
              <Path d={getAreaPath(pointsGave)} fill="url(#gradGave)" />
              <Path d={getAreaPath(pointsGot)} fill="url(#gradGot)" />

              {/* Draw Lines */}
              <Path d={getCurvePath(pointsGave)} fill="none" stroke={COLORS.danger} strokeWidth={3} />
              <Path d={getCurvePath(pointsGot)} fill="none" stroke={COLORS.success} strokeWidth={3} />

              {/* Interactive/Selectable Dots for Gave */}
              {pointsGave.map((pt, idx) => (
                <Circle
                  key={`gave-${idx}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={activeWeekIdx === idx ? 7 : 4}
                  fill={COLORS.danger}
                  stroke={COLORS.white}
                  strokeWidth={2}
                  onPress={() => setActiveWeekIdx(idx)}
                />
              ))}

              {/* Interactive/Selectable Dots for Got */}
              {pointsGot.map((pt, idx) => (
                <Circle
                  key={`got-${idx}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={activeWeekIdx === idx ? 7 : 4}
                  fill={COLORS.success}
                  stroke={COLORS.white}
                  strokeWidth={2}
                  onPress={() => setActiveWeekIdx(idx)}
                />
              ))}
            </Svg>
          </View>

          {/* Legend indicator badges */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.danger }]} />
              <Text style={styles.legendText}>Credit Given (Gave)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
              <Text style={styles.legendText}>Cash Got (Got)</Text>
            </View>
          </View>

          {/* Compare Selector Tabs */}
          <View style={styles.weekTabs}>
            {trendData.map((w, idx) => (
              <TouchableOpacity
                key={w.label}
                style={[styles.weekTab, activeWeekIdx === idx && styles.weekTabActive]}
                onPress={() => setActiveWeekIdx(idx)}
              >
                <Text style={[styles.weekTabLabel, activeWeekIdx === idx && styles.weekTabLabelActive]}>{w.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Week Summary Details */}
        <Text style={styles.sectionHeader}>{trendData[activeWeekIdx].label} Details</Text>
        
        <View style={styles.summaryCard}>
          <View style={styles.metricGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Credit Extended (Gave)</Text>
              <Text style={[styles.metricValue, { color: COLORS.danger }]}>{getCurrencySymbol()}{activeWeek.gave.toLocaleString()}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Cash Received (Got)</Text>
              <Text style={[styles.metricValue, { color: COLORS.success }]}>{getCurrencySymbol()}{activeWeek.got.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.netFlowBox}>
            <Text style={styles.netFlowTitle}>Net Cash Flow</Text>
            <Text style={[styles.netFlowVal, { color: netInflow >= 0 ? COLORS.success : COLORS.danger }]}>
              {netInflow >= 0 ? '+' : ''}{getCurrencySymbol()}{netInflow.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Additional Analytics Panel */}
        <View style={styles.summaryCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Log Status</Text>
            <Text style={styles.detailVal}>{activeWeek.isForecast ? 'Predicted estimates' : 'Registered ledger logs'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Entries Count</Text>
            <Text style={styles.detailVal}>{activeWeek.txCount}</Text>
          </View>
          
          <Text style={styles.adviceBox}>
            <Text style={{ fontWeight: '700' }}>Cash Recommendation: </Text>
            {activeWeek.isForecast 
              ? 'Estimate is based on outstanding ledger bills and peer sync alerts. Focus on collecting older outstanding debts.'
              : netInflow >= 0 
                ? 'Cash flow is positive. Your collections are exceeding new credit. Settle pending payouts.'
                : 'New credit extensions are exceeding collection returns. Place limits on high-debt accounts.'
            }
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFC' },
  scrollContent: { padding: 16 },
  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    marginBottom: 20,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  cardSubtitle: { fontSize: 11, color: COLORS.textLight, marginBottom: 16 },
  svgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: COLORS.textLight, fontWeight: '600' },
  weekTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    padding: 3,
    marginTop: 16,
  },
  weekTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 20,
  },
  weekTabActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  weekTabLabel: { fontSize: 11, color: COLORS.textLight, fontWeight: '600' },
  weekTabLabelActive: { color: COLORS.primary, fontWeight: '700' },
  sectionHeader: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    marginBottom: 30,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeForecast: { backgroundColor: '#EFF6FF' },
  badgeActual: { backgroundColor: '#ECFDF5' },
  badgeText: { fontSize: 10, fontWeight: '700', color: COLORS.primary },
  weekRange: { fontSize: 12, color: COLORS.textLight, marginTop: 4, marginBottom: 16 },
  metricGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  metricCard: {
    flex: 1,
    backgroundColor: '#FAFBFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  metricLabel: { fontSize: 10, color: COLORS.textLight, fontWeight: '600', textTransform: 'uppercase' },
  metricValue: { fontSize: 18, fontWeight: '800', marginTop: 6 },
  netFlowBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 16,
  },
  netFlowPlus: { backgroundColor: '#ECFDF5', borderColor: '#D1FAE5' },
  netFlowMinus: { backgroundColor: '#FDF2F2', borderColor: '#FDE2E2' },
  netFlowTitle: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  netFlowVal: { fontWeight: '800' },
  detailsSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: { fontSize: 12, color: COLORS.textLight, fontWeight: '500' },
  detailVal: { fontSize: 12, color: COLORS.text, fontWeight: '600' },
  adviceBox: {
    fontSize: 12,
    color: '#0369A1',
    lineHeight: 18,
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
});
