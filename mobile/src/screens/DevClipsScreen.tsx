import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  ref, onValue, query, orderByChild, limitToLast,
  set, remove, push,
} from 'firebase/database';
import { realtimeDb } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { COLORS, RADIUS, SPACING, FONTS } from '../config/theme';
import type { CommunityPost } from '../types';

const { width, height } = Dimensions.get('window');
const REEL_HEIGHT = height - 100;

const DEVELOPER_TOPICS = [
  'Internet of Things', 'Artificial Intelligence', 'Web Development',
  'Mobile Development', 'Cybersecurity', 'Game Development',
  'Cloud Computing', 'Open Source', 'Robotics', 'Data Science',
  'UI/UX Design', 'Career and Hackathons',
];

// ─── Reel Card (full-screen TikTok style) ────────────────────────────────────
function ReelCard({
  post,
  viewerId,
  isActive,
}: {
  post: CommunityPost;
  viewerId: string | null;
  isActive: boolean;
}) {
  const isLiked = viewerId ? Boolean(post.likedBy?.[viewerId]) : false;
  const heartScale = useRef(new Animated.Value(1)).current;
  const videoId = post.videoUrl?.match(/(?:youtu\.be\/|v=|shorts\/)([A-Za-z0-9_-]{11})/)?.[1];

  async function toggleLike() {
    if (!viewerId) { Alert.alert('Sign in to like'); return; }
    const likeRef = ref(realtimeDb, `community/posts/${post.id}/likedBy/${viewerId}`);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.5, useNativeDriver: true, speed: 40 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 40 }),
    ]).start();
    if (isLiked) await remove(likeRef);
    else await set(likeRef, true);
  }

  return (
    <View style={[styles.reelCard, { height: REEL_HEIGHT }]}>
      {/* Background */}
      {videoId ? (
        <Image
          source={{ uri: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : post.imageUrl ? (
        <Image source={{ uri: post.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <LinearGradient colors={['#1a0533', '#241b38', '#050505']} style={StyleSheet.absoluteFill} />
      )}

      {/* Gradient overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={styles.reelGradient}
        start={{ x: 0, y: 0.4 }}
        end={{ x: 0, y: 1 }}
      />

      {/* YouTube play badge */}
      {videoId && (
        <View style={styles.ytBadge}>
          <Ionicons name="logo-youtube" size={14} color="#FF0000" />
          <Text style={styles.ytBadgeText}>YouTube</Text>
        </View>
      )}

      {/* Right actions */}
      <View style={styles.reelActions}>
        <TouchableOpacity style={styles.reelAction} onPress={toggleLike}>
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={30}
              color={isLiked ? '#EF4444' : '#fff'}
            />
          </Animated.View>
          <Text style={styles.reelActionCount}>{post.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.reelAction}>
          <Ionicons name="chatbubble-outline" size={28} color="#fff" />
          <Text style={styles.reelActionCount}>{post.commentsCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.reelAction}>
          <Ionicons name="share-social-outline" size={28} color="#fff" />
          <Text style={styles.reelActionCount}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.reelAction}>
          <Ionicons name="bookmark-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Bottom info */}
      <View style={styles.reelInfo}>
        <View style={styles.reelAuthorRow}>
          <Image source={{ uri: post.authorAvatar }} style={styles.reelAuthorAvatar} />
          <View>
            <Text style={styles.reelAuthorName}>{post.authorName}</Text>
            <Text style={styles.reelTagline}>
              {post.tags?.[0] ? `#${post.tags[0]}` : '#DevContent'}
            </Text>
          </View>
        </View>
        {post.caption ? (
          <Text style={styles.reelCaption} numberOfLines={3}>{post.caption}</Text>
        ) : null}
        {videoId && (
          <TouchableOpacity
            style={styles.watchOnYT}
            onPress={() => Alert.alert('Open YouTube', `Open https://youtube.com/watch?v=${videoId}`)}
          >
            <Ionicons name="logo-youtube" size={14} color="#FF0000" />
            <Text style={styles.watchOnYTText}>Watch on YouTube</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Dev Clips Screen ─────────────────────────────────────────────────────────
export default function DevClipsScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [topicFilter, setTopicFilter] = useState('');
  const [view, setView] = useState<'for-you' | 'all'>('for-you');
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const postsRef = query(
      ref(realtimeDb, 'community/posts'),
      orderByChild('createdAt'),
      limitToLast(100)
    );
    const unsub = onValue(postsRef, (snap) => {
      const val = snap.val() as Record<string, Omit<CommunityPost, 'id'>> | null;
      const all = Object.entries(val || {})
        .map(([id, p]) => ({
          id, ...p,
          likes: Object.keys(p.likedBy || {}).length,
          commentsCount: Object.keys(p.comments || {}).length,
        }))
        .filter((p) => Boolean(p.videoUrl))
        .sort((a, b) => b.createdAt - a.createdAt);
      setPosts(all);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const filtered = posts.filter((p) => {
    if (!topicFilter) return true;
    return (p.tags || []).some((t) =>
      t.toLowerCase().includes(topicFilter.toLowerCase())
    );
  });

  if (loading) {
    return (
      <View style={styles.centered}>
        <LinearGradient colors={['#050505', '#1a0533']} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color={COLORS.purple} />
        <Text style={styles.loadingText}>Loading dev clips...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.clipsHeader}>
        <Text style={styles.clipsTitle}>Dev Clips</Text>
        <View style={styles.viewToggle}>
          {(['for-you', 'all'] as const).map((v) => (
            <TouchableOpacity
              key={v}
              style={[styles.viewBtn, view === v && styles.viewBtnActive]}
              onPress={() => setView(v)}
            >
              <Text style={[styles.viewBtnText, view === v && styles.viewBtnTextActive]}>
                {v === 'for-you' ? 'For You' : 'All'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Topic filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.topicRow}
        contentContainerStyle={{ paddingHorizontal: SPACING.base, gap: 8 }}
      >
        <TouchableOpacity
          style={[styles.topicChip, !topicFilter && styles.topicChipActive]}
          onPress={() => setTopicFilter('')}
        >
          <Text style={[styles.topicText, !topicFilter && styles.topicTextActive]}>All</Text>
        </TouchableOpacity>
        {DEVELOPER_TOPICS.slice(0, 6).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.topicChip, topicFilter === t && styles.topicChipActive]}
            onPress={() => setTopicFilter(topicFilter === t ? '' : t)}
          >
            <Text style={[styles.topicText, topicFilter === t && styles.topicTextActive]}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Reels feed */}
      {filtered.length === 0 ? (
        <View style={styles.emptyReels}>
          <LinearGradient colors={['#1a0533', '#050505']} style={StyleSheet.absoluteFill} />
          <Ionicons name="videocam-outline" size={60} color={COLORS.purpleDim} />
          <Text style={styles.emptyTitle}>No Dev Clips Yet</Text>
          <Text style={styles.emptyDesc}>
            {topicFilter
              ? `No clips for "${topicFilter}" yet. Try a different topic!`
              : 'Be the first to share a dev clip!'}
          </Text>
          <TouchableOpacity
            style={styles.shareClipBtn}
            onPress={() => Alert.alert('Share a Clip', 'Go to Home feed → Post with a YouTube URL to share a clip!')}
          >
            <Ionicons name="add-circle" size={18} color={COLORS.purple} />
            <Text style={styles.shareClipText}>Share a Dev Clip</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={filtered}
          keyExtractor={(p) => p.id}
          pagingEnabled
          snapToInterval={REEL_HEIGHT}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.y / REEL_HEIGHT);
            setActiveIndex(idx);
          }}
          renderItem={({ item, index }) => (
            <ReelCard
              post={item}
              viewerId={user?.id || null}
              isActive={index === activeIndex}
            />
          )}
          contentContainerStyle={{ paddingTop: 110 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  loadingText: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
  clipsHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.sm,
  },
  clipsTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: '#fff', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  viewToggle: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: RADIUS.full, padding: 3 },
  viewBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.full },
  viewBtnActive: { backgroundColor: COLORS.purple },
  viewBtnText: { fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  viewBtnTextActive: { color: '#fff' },
  topicRow: { position: 'absolute', top: 96, left: 0, right: 0, zIndex: 20 },
  topicChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.full, backgroundColor: 'rgba(0,0,0,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  topicChipActive: { backgroundColor: COLORS.purpleDim, borderColor: COLORS.purple },
  topicText: { fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  topicTextActive: { color: COLORS.purple },
  reelCard: { width, backgroundColor: '#000', position: 'relative' },
  reelGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' },
  ytBadge: { position: 'absolute', top: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 4 },
  ytBadgeText: { fontSize: FONTS.sizes.xs, color: '#FF0000', fontWeight: '700' },
  reelActions: { position: 'absolute', right: 16, bottom: 120, alignItems: 'center', gap: SPACING.xl },
  reelAction: { alignItems: 'center', gap: 4 },
  reelActionCount: { fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  reelInfo: { position: 'absolute', bottom: 20, left: SPACING.base, right: 80 },
  reelAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm },
  reelAuthorAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#fff' },
  reelAuthorName: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: '#fff' },
  reelTagline: { fontSize: FONTS.sizes.xs, color: COLORS.purple, fontWeight: '600', marginTop: 2 },
  reelCaption: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.9)', lineHeight: 22 },
  watchOnYT: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.sm, alignSelf: 'flex-start', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full },
  watchOnYTText: { fontSize: FONTS.sizes.xs, color: '#FF0000', fontWeight: '700' },
  emptyReels: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  emptyTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: '#fff' },
  emptyDesc: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.5)', textAlign: 'center', paddingHorizontal: 40 },
  shareClipBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.purpleDim, paddingHorizontal: SPACING.base, paddingVertical: SPACING.md, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.purple, marginTop: SPACING.sm },
  shareClipText: { color: COLORS.purple, fontWeight: '700', fontSize: FONTS.sizes.sm },
});
