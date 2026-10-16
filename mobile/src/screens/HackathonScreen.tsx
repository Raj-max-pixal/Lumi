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
  FlatList,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  ref, onValue, push, set, query,
  orderByChild, limitToLast,
} from 'firebase/database';
import { realtimeDb } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { COLORS, RADIUS, SPACING, FONTS } from '../config/theme';
import type { HackathonProject } from '../types';

type Section = 'projects' | 'publish';

const PROJECT_CATEGORIES = [
  'Web Development', 'Mobile Development', 'AI / ML', 'Cybersecurity',
  'Game Development', 'Cloud Computing', 'IoT', 'Open Source', 'Data Science', 'Other',
];

export default function HackathonScreen() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<HackathonProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<Section>('projects');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  // Publish form
  const [form, setForm] = useState({
    title: '', tagline: '', description: '', category: 'Web Development',
    technologies: '', websiteUrl: '', githubUrl: '', hackathonName: '',
  });
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const projectsRef = query(
      ref(realtimeDb, 'hackathon/projects'),
      orderByChild('createdAt'),
      limitToLast(60)
    );
    const unsub = onValue(projectsRef, (snap) => {
      const val = snap.val() as Record<string, Omit<HackathonProject, 'id'>> | null;
      setProjects(
        Object.entries(val || {})
          .map(([id, p]) => ({ id, ...p }))
          .sort((a, b) => b.createdAt - a.createdAt)
      );
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const CATEGORIES_ALL = ['All', ...PROJECT_CATEGORIES];

  const filtered = projects.filter((p) => {
    const catPass = category === 'All' || p.category === category;
    const term = search.trim().toLowerCase();
    const textPass = !term || `${p.title} ${p.tagline} ${p.authorName} ${(p.technologies || []).join(' ')}`.toLowerCase().includes(term);
    return catPass && textPass;
  });

  async function publishProject() {
    if (!user) { Alert.alert('Sign in first'); return; }
    if (!form.title.trim() || !form.tagline.trim() || !form.technologies.trim() || !form.githubUrl.trim() || !form.hackathonName.trim()) {
      Alert.alert('Missing fields', 'Fill in: title, tagline, technologies, GitHub URL, hackathon name.');
      return;
    }
    setPublishing(true);
    try {
      await set(push(ref(realtimeDb, 'hackathon/projects')), {
        authorId: user.id,
        authorName: user.name,
        authorAvatar: user.avatar,
        title: form.title.trim(),
        tagline: form.tagline.trim(),
        description: form.description.trim() || form.tagline.trim(),
        category: form.category,
        technologies: form.technologies.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 10),
        websiteUrl: form.websiteUrl.trim(),
        githubUrl: form.githubUrl.trim(),
        imageUrls: [],
        hackathonName: form.hackathonName.trim(),
        createdAt: Date.now(),
      });
      setForm({ title: '', tagline: '', description: '', category: 'Web Development', technologies: '', websiteUrl: '', githubUrl: '', hackathonName: '' });
      setSection('projects');
      Alert.alert('🚀 Published!', 'Your project is live on Lumi Hackathon Showcase!');
    } catch {
      Alert.alert('Error', 'Could not publish. Check your connection.');
    } finally {
      setPublishing(false);
    }
  }

  function ProjectCard({ project }: { project: HackathonProject }) {
    return (
      <View style={styles.projectCard}>
        {/* Gradient header */}
        <LinearGradient
          colors={['#1a3653', '#49346b']}
          style={styles.projectCardHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {project.imageUrls && project.imageUrls.length > 0 ? (
            <Image source={{ uri: project.imageUrls[0] }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <Ionicons name="code-slash" size={36} color="rgba(255,255,255,0.4)" />
          )}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{project.category || 'Project'}</Text>
          </View>
        </LinearGradient>

        <View style={styles.projectInfo}>
          <Text style={styles.projectTitle} numberOfLines={2}>{project.title}</Text>
          <Text style={styles.projectTagline} numberOfLines={2}>{project.tagline}</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.techRow}>
            {(project.technologies || []).slice(0, 5).map((t) => (
              <View key={t} style={styles.techBadge}>
                <Text style={styles.techText}>{t}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.projectAuthorRow}>
            <Image source={{ uri: project.authorAvatar }} style={styles.projectAuthorAvatar} />
            <Text style={styles.projectAuthorName}>{project.authorName}</Text>
            <View style={styles.hackBadge}>
              <Ionicons name="trophy" size={10} color="#FBBF24" />
              <Text style={styles.hackText}>{project.hackathonName}</Text>
            </View>
          </View>

          <View style={styles.projectLinks}>
            {project.githubUrl ? (
              <TouchableOpacity
                style={styles.linkBtn}
                onPress={() => Linking.openURL(project.githubUrl)}
              >
                <Ionicons name="logo-github" size={16} color={COLORS.text} />
                <Text style={styles.linkBtnText}>GitHub</Text>
              </TouchableOpacity>
            ) : null}
            {project.websiteUrl ? (
              <TouchableOpacity
                style={[styles.linkBtn, { backgroundColor: COLORS.purpleDim, borderColor: COLORS.purple }]}
                onPress={() => Linking.openURL(project.websiteUrl)}
              >
                <Ionicons name="globe-outline" size={16} color={COLORS.purple} />
                <Text style={[styles.linkBtnText, { color: COLORS.purple }]}>Live Demo</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#0b1222', 'transparent']} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Hackathon</Text>
            <Text style={styles.headerSub}>Student project showcase</Text>
          </View>
          <TouchableOpacity
            style={styles.publishFab}
            onPress={() => {
              if (!user) { Alert.alert('Sign in', 'You need to sign in to publish a project.'); return; }
              setSection(section === 'publish' ? 'projects' : 'publish');
            }}
          >
            <Ionicons name={section === 'publish' ? 'close' : 'add'} size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Projects', value: projects.length },
            { label: 'Builders', value: new Set(projects.map((p) => p.authorId)).size },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Nav */}
        <View style={styles.navRow}>
          <TouchableOpacity style={[styles.navBtn, section === 'projects' && styles.navBtnActive]} onPress={() => setSection('projects')}>
            <Text style={[styles.navText, section === 'projects' && styles.navTextActive]}>Explore</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navBtn, section === 'publish' && styles.navBtnActive]} onPress={() => setSection('publish')}>
            <Text style={[styles.navText, section === 'publish' && styles.navTextActive]}>Publish</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {section === 'projects' ? (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingTop: 220, paddingBottom: 100, paddingHorizontal: SPACING.base, gap: SPACING.md }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={{ gap: SPACING.sm, marginBottom: SPACING.sm }}>
              <View style={styles.searchRow}>
                <Ionicons name="search-outline" size={16} color={COLORS.textDim} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search projects..."
                  placeholderTextColor={COLORS.textDim}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {CATEGORIES_ALL.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.catChip, category === c && styles.catChipActive]}
                      onPress={() => setCategory(c)}
                    >
                      <Text style={[styles.catText, category === c && styles.catTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          }
          renderItem={({ item }) => <ProjectCard project={item} />}
          ListEmptyComponent={
            loading ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.purple} />
              </View>
            ) : (
              <View style={styles.centered}>
                <Ionicons name="rocket-outline" size={48} color={COLORS.purpleDim} />
                <Text style={styles.emptyText}>No projects yet</Text>
                <Text style={styles.emptyDesc}>Be the first to publish your hackathon project!</Text>
              </View>
            )
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingTop: 220, paddingBottom: 100, paddingHorizontal: SPACING.base }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.publishForm}>
            <Text style={styles.publishTitle}>Publish Your Project</Text>
            <Text style={styles.publishDesc}>Share your hackathon build with the Lumi dev community</Text>

            {([
              { label: 'Project Title *', key: 'title', placeholder: 'My Awesome App' },
              { label: 'Short Tagline *', key: 'tagline', placeholder: 'One sentence description' },
              { label: 'Full Story', key: 'description', placeholder: 'Tell the full story of your project...', multiline: true },
              { label: 'Technologies Used * (comma separated)', key: 'technologies', placeholder: 'React, Firebase, Python...' },
              { label: 'GitHub URL *', key: 'githubUrl', placeholder: 'https://github.com/you/project' },
              { label: 'Live Website URL', key: 'websiteUrl', placeholder: 'https://yourproject.com' },
              { label: 'Hackathon Name *', key: 'hackathonName', placeholder: 'Google Solution Challenge 2024' },
            ] as const).map((field) => (
              <View key={field.key} style={{ marginBottom: SPACING.md }}>
                <Text style={styles.formLabel}>{field.label}</Text>
                <TextInput
                  style={[styles.formInput, (field as any).multiline && { height: 100, textAlignVertical: 'top' }]}
                  value={form[field.key]}
                  onChangeText={(v) => setForm((f) => ({ ...f, [field.key]: v }))}
                  placeholder={field.placeholder}
                  placeholderTextColor={COLORS.textDim}
                  multiline={(field as any).multiline}
                />
              </View>
            ))}

            <View style={{ marginBottom: SPACING.md }}>
              <Text style={styles.formLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {PROJECT_CATEGORIES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.catChip, form.category === c && styles.catChipActive]}
                      onPress={() => setForm((f) => ({ ...f, category: c }))}
                    >
                      <Text style={[styles.catText, form.category === c && styles.catTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <TouchableOpacity
              style={[styles.publishBtn, publishing && { opacity: 0.7 }]}
              onPress={publishProject}
              disabled={publishing}
            >
              <LinearGradient colors={['#0891B2', COLORS.cyan]} style={styles.publishBtnGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
                {publishing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="rocket" size={18} color="#fff" />
                    <Text style={styles.publishBtnText}>Launch Project</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingTop: 54, paddingHorizontal: SPACING.base, paddingBottom: SPACING.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  headerTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
  publishFab: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.cyan, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  statCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  statValue: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.white },
  statLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  navRow: { flexDirection: 'row', gap: 4, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: 3 },
  navBtn: { flex: 1, paddingVertical: 8, borderRadius: RADIUS.md, alignItems: 'center' },
  navBtnActive: { backgroundColor: COLORS.cyan },
  navText: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textMuted },
  navTextActive: { color: '#050505' },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.cardBorder },
  searchInput: { flex: 1, height: 44, fontSize: FONTS.sizes.sm, color: COLORS.text },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.full, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder },
  catChipActive: { backgroundColor: 'rgba(34,211,238,0.15)', borderColor: COLORS.cyan },
  catText: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontWeight: '600' },
  catTextActive: { color: COLORS.cyan },
  projectCard: { backgroundColor: COLORS.card, borderRadius: RADIUS['2xl'], overflow: 'hidden', borderWidth: 1, borderColor: COLORS.cardBorder },
  projectCardHeader: { height: 160, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  categoryBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(34,211,238,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  categoryText: { fontSize: FONTS.sizes.xs, color: COLORS.cyan, fontWeight: '700' },
  projectInfo: { padding: SPACING.md },
  projectTitle: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.text },
  projectTagline: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginTop: 4, lineHeight: 20 },
  techRow: { marginTop: SPACING.sm, marginBottom: SPACING.sm },
  techBadge: { backgroundColor: COLORS.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, marginRight: 6 },
  techText: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontWeight: '500' },
  projectAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm, flexWrap: 'wrap' },
  projectAuthorAvatar: { width: 24, height: 24, borderRadius: 12 },
  projectAuthorName: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontWeight: '600' },
  hackBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(251,191,36,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  hackText: { fontSize: FONTS.sizes.xs, color: '#FBBF24', fontWeight: '600' },
  projectLinks: { flexDirection: 'row', gap: SPACING.sm },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: COLORS.surface, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.cardBorder },
  linkBtnText: { fontSize: FONTS.sizes.xs, color: COLORS.text, fontWeight: '600' },
  centered: { alignItems: 'center', paddingTop: 60, gap: SPACING.md },
  emptyText: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text },
  emptyDesc: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, textAlign: 'center', paddingHorizontal: 40 },
  publishForm: { backgroundColor: COLORS.card, borderRadius: RADIUS['2xl'], padding: SPACING.base, borderWidth: 1, borderColor: COLORS.cardBorder },
  publishTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  publishDesc: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: SPACING.base },
  formLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' },
  formInput: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.cardBorder, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, color: COLORS.text, fontSize: FONTS.sizes.sm },
  publishBtn: { borderRadius: RADIUS.full, overflow: 'hidden', marginTop: SPACING.sm },
  publishBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 15 },
  publishBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.base },
});
