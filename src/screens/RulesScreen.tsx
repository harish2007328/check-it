import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../theme/colors';
import { RULES } from '../data/ruleEngine';

const CATEGORIES = ['All Rules', 'Mandatory', 'Food Products', 'Perishables', 'Imports'];

export default function RulesScreen({ navigation }: any) {
  const [selectedCategory, setSelectedCategory] = useState('All Rules');
  const [search, setSearch] = useState('');

  const filteredRules = RULES.filter((rule) => {
    const matchesSearch =
      rule.label.toLowerCase().includes(search.toLowerCase()) ||
      rule.id.toLowerCase().includes(search.toLowerCase()) ||
      rule.description.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedCategory === 'Mandatory') return rule.required;
    if (selectedCategory === 'Food Products') return rule.field === 'fssaiLicense';
    if (selectedCategory === 'Perishables') return rule.field === 'bestBefore' || rule.field === 'dateOfManufacture';
    if (selectedCategory === 'Imports') return rule.field === 'countryOfOrigin';
    return true;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.canvas} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Legal Metrology Rules</Text>
          <Text style={styles.headerSub}>LM (Packaged Commodities) Rules 2011 / 2026.3</Text>
        </View>
        <View style={styles.badgeVersion}>
          <Text style={styles.badgeVersionText}>v2026.3</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={16} color={Colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search rule ID, title, or statute..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Feather name="x" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {CATEGORIES.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Rules List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        <Text style={styles.countText}>Showing {filteredRules.length} applicable rules</Text>

        {filteredRules.map((rule) => (
          <View key={rule.id} style={styles.ruleCard}>
            <View style={styles.ruleHeader}>
              <View style={styles.ruleIdPill}>
                <Text style={styles.ruleIdText}>{rule.id}</Text>
              </View>
              <View
                style={[
                  styles.severityPill,
                  {
                    backgroundColor:
                      rule.severity === 'CRITICAL'
                        ? Colors.failBg
                        : rule.severity === 'HIGH'
                        ? Colors.reviewBg
                        : Colors.porcelain,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.severityText,
                    {
                      color:
                        rule.severity === 'CRITICAL'
                          ? Colors.fail
                          : rule.severity === 'HIGH'
                          ? Colors.review
                          : Colors.primary,
                    },
                  ]}
                >
                  {rule.severity}
                </Text>
              </View>
            </View>

            <Text style={styles.ruleLabel}>{rule.label}</Text>
            <Text style={styles.ruleDesc}>{rule.description}</Text>

            <View style={styles.ruleFooter}>
              <View style={styles.statusItem}>
                <Feather
                  name={rule.required ? 'shield' : 'info'}
                  size={12}
                  color={rule.required ? Colors.primary : Colors.textMuted}
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.statusText}>
                  {rule.required ? 'Mandatory Clause' : 'Conditional Requirement'}
                </Text>
              </View>
            </View>
          </View>
        ))}

        <View style={styles.bottomNoteCard}>
          <Feather name="book-open" size={20} color={Colors.primary} style={{ marginBottom: 6 }} />
          <Text style={styles.bottomNoteTitle}>Statutory Rule Amendments</Text>
          <Text style={styles.bottomNoteBody}>
            The Department of Consumer Affairs publishes regular amendments to the Packaged Commodities Rules. Last updated for gazette notification 2026.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.canvas },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: { ...Typography.headline, fontSize: 20 },
  headerSub: { ...Typography.caption, marginTop: 2 },
  badgeVersion: {
    backgroundColor: Colors.porcelain,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  badgeVersionText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  filterScroll: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  filterChip: {
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.almostBlack,
    borderColor: Colors.almostBlack,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.white,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 110,
  },
  countText: {
    ...Typography.caption,
    marginBottom: Spacing.sm,
  },
  ruleCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  ruleIdPill: {
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.xs,
  },
  ruleIdText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: 'monospace',
  },
  severityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  severityText: {
    fontSize: 9,
    fontWeight: '700',
  },
  ruleLabel: {
    ...Typography.title,
    fontSize: 15,
    marginTop: 2,
    marginBottom: 4,
  },
  ruleDesc: {
    ...Typography.body,
    fontSize: 13,
    lineHeight: 18,
  },
  ruleFooter: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    ...Typography.caption,
    fontSize: 11,
  },
  bottomNoteCard: {
    backgroundColor: Colors.chromeWhite,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.chromeWhiteDark,
  },
  bottomNoteTitle: {
    ...Typography.title,
    fontSize: 14,
    marginBottom: 2,
  },
  bottomNoteBody: {
    ...Typography.body,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textPrimary,
  },
});
