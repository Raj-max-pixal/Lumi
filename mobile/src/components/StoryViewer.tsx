import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONTS } from '../config/theme';
import type { Story } from '../types';

const { width, height } = Dimensions.get('window');

type Props = {
  stories: Story[];
  activeIndex: number;
  viewerId: string | null;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onDelete?: (storyId: string) => void;
};

export default function StoryViewer({
  stories,
  activeIndex,
  viewerId,
  onNext,
  onPrev,
  onClose,
  onDelete,
}: Props) {
  const progress = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef<Animated.CompositeAnimation | null>(null);

  const activeStory = stories[activeIndex];

  useEffect(() => {
    progress.setValue(0);
    progressAnim.current?.stop();
    progressAnim.current = Animated.timing(progress, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    });
    progressAnim.current.start(({ finished }) => {
      if (finished) onNext();
    });
    return () => progressAnim.current?.stop();
  }, [activeIndex]);

  if (!activeStory) return null;

  const isOwn = viewerId === activeStory.authorId;

  return (
    <View style={styles.container}>
      {/* Background image */}
      <Image
        source={{ uri: activeStory.mediaUrl }}
        style={styles.image}
        resizeMode="contain"
      />
      <View style={styles.overlay} />

      {/* Progress bars */}
      <View style={styles.progressRow}>
        {stories.map((s, i) => (
          <View key={s.id} style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width:
                    i < activeIndex
                      ? '100%'
                      : i === activeIndex
                      ? progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        })
                      : '0%',
                },
              ]}
            />
          </View>
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Image source={{ uri: activeStory.authorAvatar }} style={styles.authorAvatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.authorName}>{activeStory.authorName}</Text>
          <Text style={styles.storyTime}>
            {new Date(activeStory.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        {isOwn && onDelete && (
          <TouchableOpacity
            onPress={() => onDelete(activeStory.id)}
            style={styles.deleteBtn}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Navigation tap areas */}
      <View style={styles.tapAreas}>
        <TouchableOpacity style={styles.tapLeft} onPress={onPrev} activeOpacity={1} />
        <TouchableOpacity style={styles.tapRight} onPress={onNext} activeOpacity={1} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 500,
  },
  image: {
    width,
    height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  progressRow: {
    position: 'absolute',
    top: 54,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    gap: 4,
    zIndex: 10,
  },
  progressTrack: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  header: {
    position: 'absolute',
    top: 68,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    zIndex: 10,
  },
  authorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#fff',
  },
  authorName: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: '#fff',
  },
  storyTime: {
    fontSize: FONTS.sizes.xs,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  deleteBtn: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: RADIUS.md,
    padding: 8,
  },
  closeBtn: {
    padding: 4,
  },
  tapAreas: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 5,
  },
  tapLeft: {
    flex: 1,
  },
  tapRight: {
    flex: 1,
  },
});
