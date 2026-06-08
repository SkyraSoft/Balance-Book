import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth } from 'date-fns';

export default function CalendarView() {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startWeekday = getDay(monthStart);
  const leadingDays = Array(startWeekday).fill(null);
  const totalDays = [...leadingDays, ...daysInMonth];

  const weekDays = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

  return (
    <View style={styles.container}>
      <Text style={styles.month}>{format(today, 'MMMM yyyy')}</Text>
      <View style={styles.weekRow}>
        {weekDays.map(day => (
          <Text key={day} style={styles.weekDay}>{day}</Text>
        ))}
      </View>
      {Array(Math.ceil(totalDays.length / 7)).fill().map((_, weekIdx) => (
        <View key={weekIdx} style={styles.weekRow}>
          {totalDays.slice(weekIdx * 7, weekIdx * 7 + 7).map((day, idx) => (
            <View key={idx} style={styles.dayCell}>
              {day && <Text style={[styles.dayText, !isSameMonth(day, today) && styles.otherMonth]}>{format(day, 'd')}</Text>}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', margin: 16, padding: 12, borderRadius: 16, elevation: 1 },
  month: { fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 12 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  weekDay: { width: 40, textAlign: 'center', fontWeight: '600', color: '#888' },
  dayCell: { width: 40, alignItems: 'center' },
  dayText: { fontSize: 14, padding: 6, textAlign: 'center' },
  otherMonth: { color: '#ccc' },
});
