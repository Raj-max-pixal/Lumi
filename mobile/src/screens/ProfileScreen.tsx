import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ref, onValue, update, set, remove, query, orderByChild, equalTo } from 'firebase/database';
import { realtimeDb } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { COLORS, RADIUS, SPACING, FONTS } from '../config/theme';
import type { FirebaseProfile, CommunityPost, NotificationItem } from '../types';

type Tab = 'posts' | 'projects' | 'about';

export default function ProfileScreen() {
  const { user, profile: myProfile, signOut } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('posts');
  const [editMode, setEditMode] = useState(false);
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Posts
    const postsUnsub = onValue(
      query(ref(realtimeDb, 'community/posts'), orderByChild('authorId'), equalTo(user.id)),
      (snap) => {
        const val = snap.val() as Record<string, Omit<CommunityPost, 'id'>> | null;
        setPosts(
          Object.entries(val || {})
            .map(([id, p]) => ({ id, ...p }))
            .filter((p) => p.authorId === user.id)
            .sort((a, b) => b.createdAt - a.createdAt)
        );
      }
    );

    // Followers / Following
    const follUnsub = onValue(ref(realtimeDb, `relationships/followers/${user.id}`), (snap) => {
      setFollowers(snap.val() ? Object.keys(snap.val()) : []);
    });
    const followingUnsub = onValue(ref(realtimeDb, `relationships/following/${user.id}`), (snap) => {
      setFollowing(snap.val() ? Object.keys(snap.val()) : []);
    });

    // Notifications
    const notifUnsub = onValue(ref(realtimeDb, `notifications/${user.id}`), (snap) => {
      const val = snap.val() as Record<string, Omit<NotificationItem, 'id'>> | null;
      setNotifications(
        Object.entries(val || {})
          .map(([id, n]) => ({ id, ...n }))
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 20)
      );
    });

    // Pre-fill edit fields
    if (myProfile) {
      setBio(myProfile.bio || '');
      setSkills((myProfile.skills || []).join(', '));
      setGithubUrl(myProfile.githubUrl || '');
      setPortfolioUrl(myProfile.portfolioUrl || '');
    }

    return () => { postsUnsub(); follUnsub(); followingUnsub(); notifUnsub(); };
  }, [user?.id, myProfile?.bio]);

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    try {
      await update(ref(realtimeDb, `publicProfiles/${user.id}`), {
        bio: bio.trim(),
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        githubUrl: githubUrl.trim(),
        portfolioUrl: portfolioUrl.trim(),
      });
      setEditMode(false);
      Alert.alert('Saved! ✅', 'Your profile has been updated.');
    } catch {
      Alert.alert('Error', 'Could not save profile. Check your connection.');
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <View style={styles.guestContainer}>
        <LinearGradient colors={['#1a0533', '#050505']} style={StyleSheet.absoluteFill} />
        <Ionicons name="person-circle-outline" size={80} color={COLORS.purpleDim} />
        <Text style={styles.guestTitle}>Your Profile</Text>
        <Text style={styles.guestDesc}>Sign in to view and customize your developer profile, see followers, and track your posts.</Text>
      </View>
    );
  }

  const safeProfile = myProfile || {
    id: user.id,
    name: user.name,
    avatar: user.avatar,
    username: user.username,
    bio: '',
    skills: [],
    interests: [],
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Cover & Avatar */}
      <LinearGradient
        colors={['#42243f', '#241b38', '#18122d', '#050505']}
        style={styles.cover}
      >
        <TouchableOpacity style={styles.signOutBtn} onPress={() => { Alert.alert('Sign Out', 'Are you sure?', [{ text: 'Cancel' }, { text: 'Sign Out', style: 'destructive', onPress: signOut }]); }}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>

        <Image source={{ uri: safeProfile.avatar }} style={styles.avatar} />

        <View style={styles.nameRow}>
          <Text style={styles.profileName}>{safeProfile.name}</Text>
          {safeProfile.githubUrl ? (
            <TouchableOpacity onPress={() => Linking.openURL(safeProfile.githubUrl!)}>
              <Ionicons name="logo-github" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
          {safeProfile.portfolioUrl ? (
            <TouchableOpacity onPress={() => Linking.openURL(safeProfile.portfolioUrl!)}>
              <Ionicons name="link-outline" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
        <Text style={styles.profileHandle}>{safeProfile.username || `@${user.id.slice(0, 8)}`}</Text>
        {safeProfile.bio ? (
          <Text style={styles.profileBio}>{safeProfile.bio}</Text>
        ) : null}

        {/* Skills */}
        {safeProfile.skills && safeProfile.skills.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: SPACING.md }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {safeProfile.skills.map((s) => (
                <View key={s} style={styles.skillBadge}>
                  <Text style={styles.skillText}>{s}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        ) : null}

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Posts', value: posts.length },
            { label: 'Followers', value: followers.length },
            { label: 'Following', value: following.length },
          ].map((stat) => (
            <View key={stat.label} style={styles.statItem}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => setEditMode(!editMode)}
        >
          <Ionicons name={editMode ? 'close-circle' : 'create-outline'} size={16} color={COLORS.purple} />
          <Text style={styles.editBtnText}>{editMode ? 'Cancel Edit' : 'Edit Profile'}</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Edit Form */}
      {editMode && (
        <View style={styles.editForm}>
          <Text style={styles.editTitle}>Edit Your Profile</Text>
          {([
            { label: 'Bio', value: bio, setter: setBio, placeholder: 'Tell devs about yourself...', multiline: true as boolean },
            { label: 'Skills (comma-separated)', value: skills, setter: setSkills, placeholder: 'React, Python, Firebase...', multiline: false as boolean },
            { label: 'GitHub URL', value: githubUrl, setter: setGithubUrl, placeholder: 'https://github.com/you', multiline: false as boolean },
            { label: 'Portfolio URL', value: portfolioUrl, setter: setPortfolioUrl, placeholder: 'https://yoursite.com', multiline: false as boolean },
          ]).map((field) => (
            <View key={field.label} style={{ marginBottom: SPACING.md }}>
              <Text style={styles.editLabel}>{field.label}</Text>
              <TextInput
                style={[styles.editInput, field.multiline && { height: 80, textAlignVertical: 'top' }]}
                value={field.value}
                onChangeText={field.setter as any}
                placeholder={field.placeholder}
                placeholderTextColor={COLORS.textDim}
                multiline={field.multiline}
              />
            </View>
          ))}
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={saveProfile}
            disabled={saving}
          >
            <LinearGradient colors={[COLORS.purple, '#7C3AED']} style={styles.saveBtnGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['posts', 'projects', 'about'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'posts' && (
          posts.length === 0 ? (
            <View style={styles.emptySection}>
              <Ionicons name="grid-outline" size={40} color={COLORS.purpleDim} />
              <Text style={styles.emptySectionText}>No posts yet. Share something!</Text>
            </View>
          ) : (
            posts.map((post) => (
              <View key={post.id} style={styles.miniPost}>
                {post.imageUrl ? (
                  <Image source={{ uri: post.imageUrl }} style={styles.miniPostImage} />
                ) : (
                  <View style={styles.miniPostText}>
                    <Ionicons name="document-text-outline" size={20} color={COLORS.purple} />
                  </View>
                )}
                <View style={styles.miniPostInfo}>
                  <Text style={styles.miniPostCaption} numberOfLines={2}>{post.caption}</Text>
                  <View style={styles.miniPostStats}>
                    <Ionicons name="heart" size={12} color={COLORS.textDim} />
                    <Text style={styles.miniStatText}>{Object.keys(post.likedBy || {}).length}</Text>
                    <Ionicons name="chatbubble" size={11} color={COLORS.textDim} style={{ marginLeft: 8 }} />
                    <Text style={styles.miniStatText}>{Object.keys(post.comments || {}).length}</Text>
                  </View>
                </View>
              </View>
            ))
          )
        )}

        {activeTab === 'projects' && (
          <View style={styles.emptySection}>
            <Ionicons name="rocket-outline" size={40} color={COLORS.purpleDim} />
            <Text style={styles.emptySectionText}>Your hackathon projects appear here</Text>
            <Text style={styles.emptyDesc}>Head to Hackathon tab to publish your first project</Text>
          </View>
        )}

        {activeTab === 'about' && (
          <View style={styles.aboutSection}>
            {/* Notifications */}
            <View style={styles.aboutCard}>
              <View style={styles.aboutCardHeader}>
                <Ionicons name="notifications" size={18} color={COLORS.purple} />
                <Text style={styles.aboutCardTitle}>Notifications</Text>
              </View>
              {notifications.length === 0 ? (
                <Text style={styles.emptyDesc}>No notifications yet</Text>
              ) : (
                notifications.slice(0, 5).map((n) => (
                  <View key={n.id} style={styles.notifItem}>
                    <View style={styles.notifDot} />
                    <View>
                      <Text style={styles.notifTitle}>{n.title}</Text>
                      <Text style={styles.notifBody}>{n.body}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Account info */}
            <View style={styles.aboutCard}>
              <Text style={styles.aboutCardTitle}>Account</Text>
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.infoText}>{user.email || 'No email'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.infoText}>User ID: {user.id.slice(0, 12)}...</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  guestContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md, padding: SPACING['2xl'] },
  guestTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.white },
  guestDesc: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },
  cover: { paddingTop: 60, paddingHorizontal: SPACING.base, paddingBottom: SPACING['2xl'] },
  signOutBtn: { alignSelf: 'flex-end', padding: SPACING.sm, marginBottom: SPACING.sm },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: COLORS.purple, marginBottom: SPACING.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flexWrap: 'wrap' },
  profileName: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.white },
  profileHandle: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginTop: 2 },
  profileBio: { fontSize: FONTS.sizes.sm, color: COLORS.text, marginTop: SPACING.md, lineHeight: 22, opacity: 0.85 },
  skillBadge: { backgroundColor: COLORS.purpleDim, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.purple },
  skillText: { fontSize: FONTS.sizes.xs, color: COLORS.purple, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: SPACING['2xl'], marginTop: SPACING.xl, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.white },
  statLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, alignSelf: 'flex-start', marginTop: SPACING.lg, backgroundColor: COLORS.purpleDim, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full },
  editBtnText: { fontSize: FONTS.sizes.sm, color: COLORS.purple, fontWeight: '600' },
  editForm: { margin: SPACING.base, backgroundColor: COLORS.card, borderRadius: RADIUS['2xl'], padding: SPACING.base, borderWidth: 1, borderColor: COLORS.cardBorder },
  editTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.base },
  editLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' },
  editInput: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.cardBorder, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, color: COLORS.text, fontSize: FONTS.sizes.sm },
  saveBtn: { borderRadius: RADIUS.full, overflow: 'hidden', marginTop: SPACING.sm },
  saveBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.base },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  tab: { flex: 1, paddingVertical: SPACING.md, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: COLORS.purple },
  tabText: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, fontWeight: '600' },
  tabTextActive: { color: COLORS.purple },
  tabContent: { padding: SPACING.base, paddingBottom: 100 },
  emptySection: { alignItems: 'center', paddingVertical: SPACING['2xl'], gap: SPACING.sm },
  emptySectionText: { fontSize: FONTS.sizes.base, color: COLORS.textMuted, fontWeight: '600' },
  emptyDesc: { fontSize: FONTS.sizes.xs, color: COLORS.textDim, textAlign: 'center', paddingHorizontal: 20 },
  miniPost: { flexDirection: 'row', gap: SPACING.md, backgroundColor: COLORS.card, borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.cardBorder },
  miniPostImage: { width: 60, height: 60, borderRadius: RADIUS.md },
  miniPostText: { width: 60, height: 60, borderRadius: RADIUS.md, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  miniPostInfo: { flex: 1 },
  miniPostCaption: { fontSize: FONTS.sizes.sm, color: COLORS.text, lineHeight: 20 },
  miniPostStats: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm },
  miniStatText: { fontSize: FONTS.sizes.xs, color: COLORS.textDim, marginLeft: 3 },
  aboutSection: { gap: SPACING.md },
  aboutCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.xl, padding: SPACING.base, borderWidth: 1, borderColor: COLORS.cardBorder, gap: SPACING.md },
  aboutCardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  aboutCardTitle: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.text },
  notifItem: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' },
  notifDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.purple, marginTop: 5 },
  notifTitle: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text },
  notifBody: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  infoText: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
});
