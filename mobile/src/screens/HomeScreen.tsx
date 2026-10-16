import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  Image,
  ScrollView,
  RefreshControl,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  ref,
  onValue,
  push,
  set,
  remove,
  query,
  orderByChild,
  limitToLast,
} from 'firebase/database';
import { realtimeDb } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { COLORS, RADIUS, SPACING, FONTS } from '../config/theme';
import type { CommunityPost, Story } from '../types';

const { width } = Dimensions.get('window');

// ─── Story Avatar ───────────────────────────────────────────────────────────
function StoryAvatar({
  story,
  isUser,
  onPress,
}: {
  story?: Story;
  isUser?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.storyItem} onPress={onPress} activeOpacity={0.85}>
      <LinearGradient
        colors={COLORS.gradientStory}
        style={styles.storyRing}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.storyAvatarWrap}>
          {isUser ? (
            <View style={styles.addStoryWrap}>
              <Ionicons name="add" size={22} color={COLORS.purple} />
            </View>
          ) : (
            <Image
              source={{ uri: story?.authorAvatar || 'https://api.dicebear.com/9.x/notionists/svg?seed=lumi' }}
              style={styles.storyAvatar}
            />
          )}
        </View>
      </LinearGradient>
      <Text style={styles.storyName} numberOfLines={1}>
        {isUser ? 'Your Story' : story?.authorName?.split(' ')[0] || 'Dev'}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Post Card ───────────────────────────────────────────────────────────────
function PostCard({
  post,
  onLike,
  onComment,
  onSave,
  viewerId,
}: {
  post: CommunityPost;
  onLike: () => void;
  onComment: () => void;
  onSave: () => void;
  viewerId: string | null;
}) {
  const isLiked = viewerId ? Boolean(post.likedBy?.[viewerId]) : false;
  const isSaved = viewerId ? Boolean(post.savedBy?.[viewerId]) : false;
  const heartScale = useRef(new Animated.Value(1)).current;

  function animateHeart() {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, speed: 40 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 40 }),
    ]).start();
    onLike();
  }

  const videoId = post.videoUrl?.match(
    /(?:youtu\.be\/|v=|shorts\/)([A-Za-z0-9_-]{11})/
  )?.[1];

  return (
    <View style={styles.postCard}>
      {/* Header */}
      <View style={styles.postHeader}>
        <Image
          source={{ uri: post.authorAvatar || 'https://api.dicebear.com/9.x/notionists/svg?seed=lumi' }}
          style={styles.postAvatar}
        />
        <View style={styles.postAuthorInfo}>
          <Text style={styles.postAuthorName}>{post.authorName}</Text>
          <Text style={styles.postTime}>
            {new Date(post.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
        {post.tags?.[0] && (
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{post.tags[0]}</Text>
          </View>
        )}
      </View>

      {/* Caption */}
      {post.caption ? (
        <Text style={styles.postCaption} numberOfLines={4}>
          {post.caption}
        </Text>
      ) : null}

      {/* Media */}
      {post.imageUrl ? (
        <Image
          source={{ uri: post.imageUrl }}
          style={styles.postMedia}
          resizeMode="cover"
        />
      ) : videoId ? (
        <View style={styles.videoThumb}>
          <Image
            source={{ uri: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <View style={styles.playOverlay}>
            <Ionicons name="logo-youtube" size={40} color="#FF0000" />
          </View>
        </View>
      ) : null}

      {/* Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={animateHeart}>
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={24}
              color={isLiked ? '#EF4444' : COLORS.textMuted}
            />
          </Animated.View>
          <Text style={styles.actionCount}>{post.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={onComment}>
          <Ionicons name="chatbubble-outline" size={22} color={COLORS.textMuted} />
          <Text style={styles.actionCount}>{post.commentsCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="share-social-outline" size={22} color={COLORS.textMuted} />
          <Text style={styles.actionCount}>{post.shares}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, { marginLeft: 'auto' }]} onPress={onSave}>
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={isSaved ? COLORS.purple : COLORS.textMuted}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Comment Sheet ────────────────────────────────────────────────────────────
function CommentSheet({
  post,
  viewer,
  onClose,
}: {
  post: CommunityPost | null;
  viewer: { id: string; name: string; avatar: string } | null;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!post) return null;

  const comments = Object.entries(post.comments || {})
    .map(([id, c]) => ({ id, ...c }))
    .sort((a, b) => a.createdAt - b.createdAt);

  async function addComment() {
    if (!viewer || !draft.trim() || submitting) return;
    setSubmitting(true);
    try {
      const commRef = ref(realtimeDb, `community/posts/${post!.id}/comments`);
      await set(push(commRef), {
        authorId: viewer.id,
        authorName: viewer.name,
        authorHandle: `@${viewer.id.slice(0, 8)}`,
        body: draft.trim(),
        createdAt: Date.now(),
      });
      setDraft('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.commentSheet}>
      <View style={styles.sheetHandle} />
      <Text style={styles.sheetTitle}>Comments</Text>
      <FlatList
        data={comments}
        keyExtractor={(c) => c.id}
        style={styles.commentList}
        renderItem={({ item }) => (
          <View style={styles.commentItem}>
            <View style={styles.commentDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.commentAuthor}>{item.authorName}</Text>
              <Text style={styles.commentBody}>{item.body}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
        }
      />
      {viewer ? (
        <View style={styles.commentInputRow}>
          <TextInput
            style={styles.commentInput}
            value={draft}
            onChangeText={setDraft}
            placeholder="Add a comment..."
            placeholderTextColor={COLORS.textDim}
            multiline
          />
          <TouchableOpacity
            onPress={addComment}
            disabled={!draft.trim() || submitting}
            style={styles.sendBtn}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      ) : null}
      <TouchableOpacity style={styles.closeSheet} onPress={onClose}>
        <Text style={styles.closeSheetText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Home Screen ─────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [composerVisible, setComposerVisible] = useState(false);
  const [caption, setCaption] = useState('');
  const [topic, setTopic] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    const postsRef = query(
      ref(realtimeDb, 'community/posts'),
      orderByChild('createdAt'),
      limitToLast(50)
    );
    const unsub = onValue(postsRef, (snap) => {
      const val = snap.val() as Record<string, Omit<CommunityPost, 'id'>> | null;
      if (!val) { setPosts([]); setLoading(false); return; }
      const list = Object.entries(val)
        .map(([id, p]) => ({
          id,
          ...p,
          likes: Object.keys(p.likedBy || {}).length,
          commentsCount: Object.keys(p.comments || {}).length,
        }))
        .sort((a, b) => b.createdAt - a.createdAt);
      setPosts(list);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  useEffect(() => {
    const storiesRef = ref(realtimeDb, 'stories');
    const unsub = onValue(storiesRef, (snap) => {
      const val = snap.val() as Record<string, Omit<Story, 'id'>> | null;
      const now = Date.now();
      const list = Object.entries(val || {})
        .map(([id, s]) => ({ id, ...s }))
        .filter((s) => s.expiresAt > now)
        .sort((a, b) => b.createdAt - a.createdAt);
      setStories(list);
    });
    return () => unsub();
  }, []);

  async function toggleLike(post: CommunityPost) {
    if (!user) { Alert.alert('Sign in to like posts'); return; }
    const likeRef = ref(realtimeDb, `community/posts/${post.id}/likedBy/${user.id}`);
    if (post.likedBy?.[user.id]) {
      await remove(likeRef);
    } else {
      await set(likeRef, true);
    }
  }

  async function toggleSave(post: CommunityPost) {
    if (!user) { Alert.alert('Sign in to save posts'); return; }
    const saveRef = ref(realtimeDb, `community/posts/${post.id}/savedBy/${user.id}`);
    if (post.savedBy?.[user.id]) {
      await remove(saveRef);
    } else {
      await set(saveRef, true);
    }
  }

  async function publishPost() {
    if (!user) { Alert.alert('Sign in first'); return; }
    if (!caption.trim()) { Alert.alert('Add a caption'); return; }
    if (!topic) { Alert.alert('Choose a topic'); return; }
    setPosting(true);
    try {
      await set(push(ref(realtimeDb, 'community/posts')), {
        authorId: user.id,
        authorName: user.name,
        authorAvatar: user.avatar,
        caption: caption.trim(),
        imageUrl: '',
        videoUrl: '',
        createdAt: Date.now(),
        likes: 0,
        commentsCount: 0,
        shares: 0,
        savedCount: 0,
        tags: [topic],
        likedBy: {},
        savedBy: {},
        comments: {},
      });
      setCaption('');
      setTopic('');
      setComposerVisible(false);
      Alert.alert('Posted! 🚀', 'Your post is now live on Lumi.');
    } catch {
      Alert.alert('Error', 'Could not publish. Check your connection.');
    } finally {
      setPosting(false);
    }
  }

  const TOPICS = [
    'Web Development', 'Mobile Development', 'AI', 'Cloud',
    'Cybersecurity', 'Open Source', 'Data Science', 'Career',
  ];

  const ListHeader = (
    <View>
      {/* Stories Rail */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.storiesRail}
        contentContainerStyle={{ paddingHorizontal: SPACING.base, gap: SPACING.md }}
      >
        <StoryAvatar isUser onPress={() => Alert.alert('📸 Share Story', 'Story sharing coming soon!')} />
        {stories.map((s) => (
          <StoryAvatar key={s.id} story={s} onPress={() => Alert.alert(s.authorName, 'Full story viewer coming!')} />
        ))}
        {stories.length === 0 && (
          <View style={styles.noStoriesHint}>
            <Text style={styles.noStoriesText}>No stories yet</Text>
          </View>
        )}
      </ScrollView>

      {/* Composer trigger */}
      <TouchableOpacity
        style={styles.composerTrigger}
        onPress={() => {
          if (!user) { Alert.alert('Sign in', 'You need to sign in to post.'); return; }
          setComposerVisible(true);
        }}
        activeOpacity={0.85}
      >
        <Image
          source={{ uri: user?.avatar || 'https://api.dicebear.com/9.x/notionists/svg?seed=lumi' }}
          style={styles.composerAvatar}
        />
        <Text style={styles.composerPlaceholder}>
          What are you building? Share with devs...
        </Text>
        <Ionicons name="create-outline" size={20} color={COLORS.purple} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#050505', 'transparent']}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <LinearGradient colors={[COLORS.purple, COLORS.cyan]} style={styles.headerLogo} start={{x:0,y:0}} end={{x:1,y:1}}>
            <Ionicons name="code-slash" size={18} color="#fff" />
          </LinearGradient>
          <Text style={styles.headerTitle}>Lumi</Text>
          <TouchableOpacity style={styles.headerAction}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Feed */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.purple} />
          <Text style={styles.loadingText}>Loading your dev feed...</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              viewerId={user?.id || null}
              onLike={() => toggleLike(item)}
              onComment={() => setSelectedPost(item)}
              onSave={() => toggleSave(item)}
            />
          )}
          ListHeaderComponent={ListHeader}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => setRefreshing(false)}
              tintColor={COLORS.purple}
            />
          }
          contentContainerStyle={{ paddingTop: 80, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyFeed}>
              <Ionicons name="code-slash" size={48} color={COLORS.purpleDim} />
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptyDesc}>
                Be the first developer to post on Lumi!
              </Text>
            </View>
          }
        />
      )}

      {/* Post Composer Modal */}
      {composerVisible && (
        <View style={styles.composerModal}>
          <View style={styles.composerCard}>
            <View style={styles.composerHeader}>
              <Text style={styles.composerTitle}>New Post</Text>
              <TouchableOpacity onPress={() => setComposerVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.composerTextArea}
              placeholder="What are you building, learning, or teaching? Share with the dev community..."
              placeholderTextColor={COLORS.textDim}
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={2000}
            />
            <Text style={styles.composerLabel}>Developer Topic</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {TOPICS.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.topicChip, topic === t && styles.topicChipActive]}
                    onPress={() => setTopic(t)}
                  >
                    <Text style={[styles.topicChipText, topic === t && styles.topicChipTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity
              style={[styles.postBtn, posting && { opacity: 0.7 }]}
              onPress={publishPost}
              disabled={posting}
            >
              <LinearGradient colors={[COLORS.purple, '#7C3AED']} style={styles.postBtnGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
                {posting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color="#fff" />
                    <Text style={styles.postBtnText}>Post to Lumi</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Comment Sheet */}
      {selectedPost && (
        <View style={styles.commentOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setSelectedPost(null)}
          />
          <CommentSheet
            post={selectedPost}
            viewer={user}
            onClose={() => setSelectedPost(null)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 50,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.base,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerLogo: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  headerTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.white, flex: 1 },
  headerAction: { padding: 4 },
  storiesRail: { paddingVertical: SPACING.md },
  storyItem: { alignItems: 'center', width: 72 },
  storyRing: { width: 68, height: 68, borderRadius: 34, padding: 2, alignItems: 'center', justifyContent: 'center' },
  storyAvatarWrap: { width: 62, height: 62, borderRadius: 31, backgroundColor: COLORS.card, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.bg },
  storyAvatar: { width: 62, height: 62, borderRadius: 31 },
  addStoryWrap: { alignItems: 'center', justifyContent: 'center', width: 62, height: 62 },
  storyName: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' },
  noStoriesHint: { justifyContent: 'center', paddingHorizontal: 16 },
  noStoriesText: { fontSize: FONTS.sizes.xs, color: COLORS.textDim },
  composerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: SPACING.md,
  },
  composerAvatar: { width: 36, height: 36, borderRadius: 18 },
  composerPlaceholder: { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.textDim },
  postCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  postAvatar: { width: 40, height: 40, borderRadius: 20 },
  postAuthorInfo: { flex: 1 },
  postAuthorName: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.text },
  postTime: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  tagBadge: { backgroundColor: COLORS.purpleDim, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  tagText: { fontSize: FONTS.sizes.xs, color: COLORS.purple, fontWeight: '600' },
  postCaption: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.md, fontSize: FONTS.sizes.sm, color: COLORS.text, lineHeight: 22 },
  postMedia: { width: '100%', height: 260 },
  videoThumb: { width: '100%', height: 220, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  playOverlay: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 40, width: 72, height: 72 },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    gap: SPACING.sm,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 4 },
  actionCount: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontWeight: '600' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  loadingText: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
  emptyFeed: { alignItems: 'center', paddingTop: 60, gap: SPACING.md },
  emptyTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.text },
  emptyDesc: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, textAlign: 'center', paddingHorizontal: 40 },
  commentOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end', zIndex: 100 },
  commentSheet: { backgroundColor: COLORS.card, borderTopLeftRadius: RADIUS['3xl'], borderTopRightRadius: RADIUS['3xl'], padding: SPACING.base, maxHeight: '70%' },
  sheetHandle: { width: 40, height: 4, backgroundColor: COLORS.cardBorder, borderRadius: 2, alignSelf: 'center', marginBottom: SPACING.md },
  sheetTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  commentList: { maxHeight: 300 },
  commentItem: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md, alignItems: 'flex-start' },
  commentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.purple, marginTop: 6 },
  commentAuthor: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.purple },
  commentBody: { fontSize: FONTS.sizes.sm, color: COLORS.text, marginTop: 2 },
  commentInputRow: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-end', marginTop: SPACING.sm },
  commentInput: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, color: COLORS.text, fontSize: FONTS.sizes.sm, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.purple, alignItems: 'center', justifyContent: 'center' },
  closeSheet: { alignItems: 'center', paddingVertical: SPACING.md, marginTop: SPACING.sm },
  closeSheetText: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, fontWeight: '600' },
  emptyText: { textAlign: 'center', color: COLORS.textDim, fontSize: FONTS.sizes.sm, paddingVertical: SPACING.lg },
  composerModal: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: SPACING.base, zIndex: 200 },
  composerCard: { backgroundColor: COLORS.card, borderRadius: RADIUS['2xl'], padding: SPACING.base, borderWidth: 1, borderColor: COLORS.cardBorder },
  composerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.base },
  composerTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text },
  composerTextArea: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, color: COLORS.text, fontSize: FONTS.sizes.sm, minHeight: 120, textAlignVertical: 'top', marginBottom: SPACING.md },
  composerLabel: { fontSize: FONTS.sizes.xs, fontWeight: '600', color: COLORS.textMuted, marginBottom: SPACING.sm, textTransform: 'uppercase' },
  topicChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.cardBorder },
  topicChipActive: { backgroundColor: COLORS.purpleDim, borderColor: COLORS.purple },
  topicChipText: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontWeight: '600' },
  topicChipTextActive: { color: COLORS.purple },
  postBtn: { borderRadius: RADIUS.full, overflow: 'hidden', marginTop: SPACING.sm },
  postBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 14 },
  postBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.base },
});
