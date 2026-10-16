import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/theme';

type Tab = 'Home' | 'Explore' | 'AILab' | 'Hackathon' | 'Chat' | 'Profile';

type TabConfig = {
  key: Tab;
  label: string;
  icon: string;
  iconActive: string;
};

const TABS: TabConfig[] = [
  { key: 'Home', label: 'Home', icon: 'home-outline', iconActive: 'home' },
  { key: 'Explore', label: 'Explore', icon: 'compass-outline', iconActive: 'compass' },
  { key: 'AILab', label: 'AI Lab', icon: 'sparkles-outline', iconActive: 'sparkles' },
  { key: 'Hackathon', label: 'Build', icon: 'rocket-outline', iconActive: 'rocket' },
  { key: 'Chat', label: 'Chat', icon: 'chatbubbles-outline', iconActive: 'chatbubbles' },
  { key: 'Profile', label: 'Me', icon: 'person-outline', iconActive: 'person' },
];

type Props = {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
};

export default function BottomTabBar({ activeTab, onTabChange }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => onTabChange(tab.key)}
              activeOpacity={0.7}
            >
              {/* Active indicator dot */}
              {isActive && tab.key === 'Home' && (
                <View style={styles.activeDot} />
              )}

              {tab.key === 'AILab' ? (
                // Special AI Lab button
                <View style={[styles.aiBtn, isActive && styles.aiBtnActive]}>
                  <Ionicons
                    name={(isActive ? tab.iconActive : tab.icon) as any}
                    size={22}
                    color={isActive ? '#fff' : COLORS.textMuted}
                  />
                </View>
              ) : (
                <Ionicons
                  name={(isActive ? tab.iconActive : tab.icon) as any}
                  size={24}
                  color={isActive ? COLORS.purple : COLORS.textMuted}
                />
              )}

              <Text
                style={[
                  styles.label,
                  isActive && tab.key !== 'AILab' && styles.labelActive,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(5,5,5,0.97)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 24,
    paddingTop: 10,
  },
  bar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 4,
    position: 'relative',
  },
  activeDot: {
    position: 'absolute',
    top: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.purple,
  },
  label: {
    fontSize: 10,
    color: COLORS.textDim,
    fontWeight: '500',
  },
  labelActive: {
    color: COLORS.purple,
    fontWeight: '700',
  },
  aiBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.purpleDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.purple,
    marginBottom: -2,
  },
  aiBtnActive: {
    backgroundColor: COLORS.purple,
    borderColor: 'transparent',
  },
});
