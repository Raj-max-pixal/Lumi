import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ref, onValue, query, orderByChild, limitToLast, set, remove } from 'firebase/database';
import { realtimeDb } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { COLORS, RADIUS, SPACING, FONTS } from '../config/theme';
import type { CommunityPost } from '../types';

const { width } = Dimensions.get('window');
const CARD_W = (width - SPACING.base * 2 - SPACING.sm) / 2;

const CATEGORIES = ['All', 'Photos', 'Dev Clips', 'Threads', 'Web Dev', 'AI', 'Mobile', 'Cloud'];

export default function ExploreScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [query2, setQuery2] = useState('');
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState<CommunityPost | null>(null);

  useEffect(() => {
    const postsRef = query(
      ref(realtimeDb, 'community/posts'),
      orderByChild('createdAt'),
      limitToLast(100)
    );
    const unsub = onValue(postsRef, (snap) => {
      const val = snap.val() as Record<string, Omit<CommunityPost, 'id'>> | null;
      if (!val) { setPosts([]); setLoading(false); return; }
      const list = Object.entries(val)
        .map(([id, p]) => ({
          id, ...p,
          likes: Object.keys(p.likedBy || {}).length,
          commentsCount: Object.keys(p.comments || {}).length,
        }))
        .sort((a, b) => b.createdAt - a.createdAt);
      setPosts(list);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const term = query2.trim().toLowerCase();
    return posts.filter((p) => {
      const catPass =
        category === 'All' ? true
        : category === 'Photos' ? Boolean(p.imageUrl)
        : category === 'Dev Clips' ? Boolean(p.videoUrl)
        : category === 'Threads' ? !p.imageUrl && !p.videoUrl
        : (p.tags || []).some((t) => t.toLowerCase().includes(category.toLowerCase()));
      const textPass = !term || `${p.authorName} ${p.caption} ${(p.tags || []).join(' ')}`.toLowerCase().includes(term);
      return catPass && textPass;
    });
  }, [posts, query2, category]);

  async function toggleLike(post: CommunityPost) {
    if (!user) return;
    const likeRef = ref(realtimeDb, `community/posts/${post.id}/likedBy/${user.id}`);
    if (post.likedBy?.[user.id]) await remove(likeRef);
    else await set(likeRef, true);
  }

  const videoId = (url?: string) =>
    url?.match(/(?:youtu\.be\/|v=|shorts\/)([A-Za-z0-9_-]{11})/)?.[1];

  function GridCard({ item }: { item: CommunityPost }) {
    const vid = videoId(item.videoUrl);
    const thumb = item.imageUrl || (vid ? `https://img.youtube.com/vi/${vid}/mqdefault.jpg` : null);
    return (
      <TouchableOpacity
        style={[styles.gridCard, { width: CARD_W }]}
        onPress={() => setSelected(item)}
        activeOpacity={0.85}
      >
        {thumb ? (
          <Image source={{ uri: thumb }} style={styles.gridThumb} resizeMode="cover" />
        ) : (
          <View style={styles.gridThumbText}>
            <Ionicons name="code-slash" size={24} color={COLORS.purple} />
          </View>
        )}
        {vid && (
          <View style={styles.videoIndicator}>
            <Ionicons name="logo-youtube" size={14} color="#FF0000" />
          </View>
        )}
        <View style={styles.gridInfo}>
          <Text style={styles.gridAuthor} numberOfLines={1}>{item.authorName}</Text>
          {item.caption ? (
            <Text style={styles.gridCaption} numberOfLines={2}>{item.caption}</Text>
          ) : null}
          <View style={styles.gridStats}>
            <Ionicons name="heart" size={12} color={COLORS.textDim} />
            <Text style={styles.gridStatText}>{item.likes}</Text>
            <Ionicons name="chatbubble" size={11} color={COLORS.textDim} style={{ marginLeft: 6 }} />
            <Text style={styles.gridStatText}>{item.commentsCount}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#050505', 'transparent']} style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <Text style={styles.headerSub}>Discover developers & projects</Text>
      </LinearGradient>

      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={{ gap: SPACING.sm }}
        contentContainerStyle={{ paddingTop: 120, paddingBottom: 100, paddingHorizontal: SPACING.base, gap: SPACING.sm }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Search */}
            <View style={styles.searchRow}>
              <Ionicons name="search-outline" size={18} color={COLORS.textDim} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search creators, captions, tags..."
                placeholderTextColor={COLORS.textDim}
                value={query2}
                onChangeText={setQuery2}
              />
              {query2 ? (
                <TouchableOpacity onPress={() => setQuery2('')}>
                  <Ionicons name="close-circle" size={18} color={COLORS.textDim} />
                </TouchableOpacity>
              ) : null}
            </View>
            {/* Category chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.catChip, category === c && styles.catChipActive]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[styles.catText, category === c && styles.catTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.resultCount}>{filtered.length} posts</Text>
          </View>
        }
        renderItem={({ item }) => <GridCard item={item} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={COLORS.purple} />
            </View>
          ) : (
            <View style={styles.centered}>
              <Ionicons name="search" size={48} color={COLORS.purpleDim} />
              <Text style={styles.emptyText}>No posts match your search</Text>
            </View>
          )
        }
      />

      {/* Detail Modal */}
      {selected && (
        <View style={styles.detailOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setSelected(null)} />
          <View style={styles.detailCard}>
            <TouchableOpacity style={styles.detailClose} onPress={() => setSelected(null)}>
              <Ionicons name="close" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <View style={styles.detailAuthorRow}>
              <Image source={{ uri: selected.authorAvatar }} style={styles.detailAvatar} />
              <View>
                <Text style={styles.detailAuthor}>{selected.authorName}</Text>
                <Text style={styles.detailDate}>{new Date(selected.createdAt).toLocaleDateString()}</Text>
              </View>
            </View>
            {selected.imageUrl && (
              <Image source={{ uri: selected.imageUrl }} style={styles.detailImage} resizeMode="cover" />
            )}
            {selected.caption ? (
              <Text style={styles.detailCaption}>{selected.caption}</Text>
            ) : null}
            <View style={styles.detailTags}>
              {(selected.tags || []).map((t) => (
                <View key={t} style={styles.tagPill}>
                  <Text style={styles.tagPillText}>#{t}</Text>
                </View>
              ))}
            </View>
            <View style={styles.detailActions}>
              <TouchableOpacity style={styles.detailActionBtn} onPress={() => toggleLike(selected)}>
                <Ionicons
                  name={user && selected.likedBy?.[user.id] ? 'heart' : 'heart-outline'}
                  size={22}
                  color={user && selected.likedBy?.[user.id] ? '#EF4444' : COLORS.textMuted}
                />
                <Text style={styles.detailActionText}>{selected.likes} likes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.detailActionBtn}>
                <Ionicons name="chatbubble-outline" size={20} color={COLORS.textMuted} />
                <Text style={styles.detailActionText}>{selected.commentsCount} comments</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingTop: 54, paddingHorizontal: SPACING.base, paddingBottom: SPACING.base },
  headerTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginTop: 2 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
  },
  searchIcon: { marginRight: SPACING.sm },
  searchInput: { flex: 1, height: 46, fontSize: FONTS.sizes.sm, color: COLORS.text },
  categories: { marginBottom: SPACING.sm },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.card, marginRight: 8, borderWidth: 1, borderColor: COLORS.cardBorder },
  catChipActive: { backgroundColor: COLORS.purpleDim, borderColor: COLORS.purple },
  catText: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontWeight: '600' },
  catTextActive: { color: COLORS.purple },
  resultCount: { fontSize: FONTS.sizes.xs, color: COLORS.textDim, marginBottom: SPACING.sm },
  gridCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.cardBorder },
  gridThumb: { width: '100%', height: 160 },
  gridThumbText: { width: '100%', height: 120, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface },
  videoIndicator: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 6, padding: 4 },
  gridInfo: { padding: SPACING.sm },
  gridAuthor: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.purple },
  gridCaption: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2, lineHeight: 16 },
  gridStats: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  gridStatText: { fontSize: FONTS.sizes.xs, color: COLORS.textDim, marginLeft: 3 },
  centered: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: SPACING.md },
  emptyText: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
  detailOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: SPACING.base, zIndex: 200 },
  detailCard: { backgroundColor: COLORS.card, borderRadius: RADIUS['2xl'], padding: SPACING.base, borderWidth: 1, borderColor: COLORS.cardBorder, maxHeight: '85%' },
  detailClose: { alignSelf: 'flex-end', padding: 4, marginBottom: SPACING.sm },
  detailAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  detailAvatar: { width: 44, height: 44, borderRadius: 22 },
  detailAuthor: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.text },
  detailDate: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  detailImage: { width: '100%', height: 220, borderRadius: RADIUS.lg, marginBottom: SPACING.md },
  detailCaption: { fontSize: FONTS.sizes.sm, color: COLORS.text, lineHeight: 22, marginBottom: SPACING.md },
  detailTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: SPACING.md },
  tagPill: { backgroundColor: COLORS.purpleDim, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  tagPillText: { fontSize: FONTS.sizes.xs, color: COLORS.purple, fontWeight: '600' },
  detailActions: { flexDirection: 'row', gap: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.cardBorder, paddingTop: SPACING.md },
  detailActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailActionText: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
});
