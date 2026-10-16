import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONTS } from '../config/theme';

type AITool = {
  id: string;
  title: string;
  icon: string;
  desc: string;
  prompt: string;
};

type Personality = 'mentor' | 'coach' | 'savage';

const AI_TOOLS: AITool[] = [
  { id: 'caption', title: 'Post Caption', icon: 'create-outline', desc: 'Generate viral dev captions', prompt: 'short project clip for developers' },
  { id: 'hashtags', title: 'Hashtags', icon: 'pricetag-outline', desc: 'Best hashtags for your post', prompt: 'developer project post' },
  { id: 'bio', title: 'Dev Bio', icon: 'person-outline', desc: 'Write your developer bio', prompt: 'improve my dev profile bio' },
  { id: 'viral-ideas', title: 'Viral Ideas', icon: 'flash-outline', desc: 'Content ideas that go viral', prompt: 'developer content ideas' },
  { id: 'thread', title: 'Thread Writer', icon: 'list-outline', desc: 'Write engaging dev threads', prompt: 'my latest project' },
  { id: 'growth', title: 'Growth Tips', icon: 'trending-up-outline', desc: 'Grow your dev following', prompt: 'improve my developer presence' },
  { id: 'job', title: 'Job Prep', icon: 'briefcase-outline', desc: 'Resume & interview help', prompt: 'full stack developer role' },
  { id: 'assistant', title: 'Ask Lumi AI', icon: 'sparkles-outline', desc: 'General dev assistant', prompt: 'help with my coding question' },
];

const PERSONALITIES: { id: Personality; label: string; icon: string }[] = [
  { id: 'mentor', label: 'Mentor', icon: 'school-outline' },
  { id: 'coach', label: 'Coach', icon: 'fitness-outline' },
  { id: 'savage', label: 'Savage', icon: 'flame-outline' },
];

function generateLocalResponse(tool: string, prompt: string, personality: Personality): string {
  const tone =
    personality === 'coach'
      ? 'Motivational coach'
      : personality === 'savage'
      ? 'Savage dev friend'
      : 'Professional mentor';

  const cleaned = prompt.trim() || 'your latest dev project';

  const outputs: Record<string, string> = {
    caption: `${tone}: "Shipped another feature at 2am. Sleep is overrated when you're building something this good. #DevLife #Lumi" — Try this angle for "${cleaned}".`,
    hashtags: `#${tone.replace(' ', '')} #Lumi #DevCommunity #CodeNewbie #BuildInPublic #OpenSource #${cleaned.replace(/\s+/g, '')}`,
    bio: `${tone}: "Full-stack developer | Building ${cleaned} | Open to collabs | Let's connect on Lumi 🚀"`,
    'viral-ideas': `${tone} for "${cleaned}":\n1. Before/after code refactor carousel\n2. "I built X in 24 hours" speed run\n3. Hot take thread about ${cleaned}\n4. Tutorial series: build it from scratch\n5. Behind-the-scenes dev vlog`,
    thread: `${tone} thread for "${cleaned}":\n\n1/ Here's what I learned building ${cleaned}...\n\n2/ The hardest part wasn't the code — it was knowing WHERE to start.\n\n3/ Here's the exact approach I used:\n\n4/ Result: shipped in [X days]. 3 lessons every dev needs to know 🧵`,
    growth: `${tone}: Post at 7-9pm your timezone. Use 5-7 hashtags. Reply to every comment in the first hour. Cross-post to LinkedIn. Share your process, not just results. Add value in others' comments. Consistency > virality.`,
    job: `${tone} for "${cleaned}":\n• Lead with impact metrics (e.g., "reduced load time by 40%")\n• Keep resume to 1 page if <5 years exp\n• Practice: "Tell me about a challenge in ${cleaned}"\n• Research the company deeply\n• Ask: "What does success look like in 90 days?"`,
    assistant: `${tone} on "${cleaned}":\n\nGreat question. Here's a direct answer with practical next steps:\n\n1. Start with the fundamentals\n2. Build a small proof-of-concept\n3. Get feedback early and often\n4. Iterate based on real usage\n\nWant me to go deeper on any of these points?`,
  };

  return outputs[tool] || `${tone}: I can help with "${cleaned}". Let me generate a custom response for you. Try the AI tools above for specialized assistance.`;
}

export default function AILabScreen() {
  const [chatPrompt, setChatPrompt] = useState('How do I grow my developer audience on Lumi?');
  const [output, setOutput] = useState('Your Lumi AI workspace is ready. Ask anything or tap a tool below! 🤖');
  const [loading, setLoading] = useState(false);
  const [personality, setPersonality] = useState<Personality>('mentor');
  const [activeTool, setActiveTool] = useState<string | null>(null);

  async function runTool(toolId: string, prompt: string) {
    setLoading(true);
    setActiveTool(toolId);
    try {
      // Try the Lumi AI API first
      const response = await fetch('https://lumi-f0d6b.vercel.app/api/ai/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: toolId, prompt, personality }),
        signal: AbortSignal.timeout(8000),
      });
      if (response.ok) {
        const data = await response.json() as { text?: string };
        setOutput(data.text || generateLocalResponse(toolId, prompt, personality));
      } else {
        setOutput(generateLocalResponse(toolId, prompt, personality));
      }
    } catch {
      // Fallback to local generation
      setOutput(generateLocalResponse(toolId, prompt, personality));
    } finally {
      setLoading(false);
      setActiveTool(null);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <LinearGradient
        colors={['#1a0533', '#0d0521', COLORS.bg]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <LinearGradient colors={[COLORS.purple, COLORS.cyan]} style={styles.headerIcon} start={{x:0,y:0}} end={{x:1,y:1}}>
            <Ionicons name="sparkles" size={22} color="#fff" />
          </LinearGradient>
          <View>
            <Text style={styles.headerTitle}>Lumi AI Lab</Text>
            <Text style={styles.headerSub}>Developer AI tools & assistant</Text>
          </View>
        </View>

        {/* Personality selector */}
        <View style={styles.personalityRow}>
          {PERSONALITIES.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.personalityBtn, personality === p.id && styles.personalityBtnActive]}
              onPress={() => setPersonality(p.id)}
            >
              <Ionicons name={p.icon as any} size={14} color={personality === p.id ? '#fff' : COLORS.textMuted} />
              <Text style={[styles.personalityText, personality === p.id && styles.personalityTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Chat Input */}
        <View style={styles.chatCard}>
          <View style={styles.chatCardHeader}>
            <Ionicons name="chatbubble-ellipses" size={18} color={COLORS.purple} />
            <Text style={styles.chatCardTitle}>AI Chat</Text>
          </View>
          <TextInput
            style={styles.chatInput}
            value={chatPrompt}
            onChangeText={setChatPrompt}
            placeholder="Ask Lumi AI anything about dev, growth, code..."
            placeholderTextColor={COLORS.textDim}
            multiline
            maxLength={500}
          />
          <View style={styles.chatBtnRow}>
            <TouchableOpacity
              style={[styles.chatBtn, { flex: 2 }]}
              onPress={() => runTool('assistant', chatPrompt)}
              disabled={loading}
            >
              <LinearGradient colors={[COLORS.purple, '#7C3AED']} style={styles.chatBtnGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
                {loading && activeTool === 'assistant' ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={16} color="#fff" />
                    <Text style={styles.chatBtnText}>Ask Lumi AI</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chatBtnOutline]}
              onPress={() => runTool('viral-ideas', chatPrompt)}
              disabled={loading}
            >
              <Text style={styles.chatBtnOutlineText}>💡 Ideas</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Output */}
        <View style={styles.outputCard}>
          <View style={styles.outputHeader}>
            <Ionicons name="document-text" size={16} color={COLORS.purple} />
            <Text style={styles.outputTitle}>AI Output</Text>
            {output !== 'Your Lumi AI workspace is ready. Ask anything or tap a tool below! 🤖' && (
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={() => Alert.alert('Copied!', 'Output copied to clipboard')}
              >
                <Ionicons name="copy-outline" size={14} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.outputContent}>
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={COLORS.purple} />
                <Text style={styles.loadingText}>Generating with AI...</Text>
              </View>
            ) : (
              <Text style={styles.outputText}>{output}</Text>
            )}
          </View>
        </View>

        {/* Tool Grid */}
        <Text style={styles.toolsTitle}>AI Developer Tools</Text>
        <View style={styles.toolGrid}>
          {AI_TOOLS.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              style={[styles.toolCard, activeTool === tool.id && styles.toolCardActive]}
              onPress={() => runTool(tool.id, chatPrompt || tool.prompt)}
              disabled={loading}
              activeOpacity={0.75}
            >
              {loading && activeTool === tool.id ? (
                <ActivityIndicator size="small" color={COLORS.purple} />
              ) : (
                <View style={styles.toolIcon}>
                  <Ionicons name={tool.icon as any} size={22} color={COLORS.purple} />
                </View>
              )}
              <Text style={styles.toolTitle}>{tool.title}</Text>
              <Text style={styles.toolDesc}>{tool.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tip */}
        <View style={styles.tipCard}>
          <Ionicons name="bulb" size={18} color="#FBBF24" />
          <Text style={styles.tipText}>
            Tip: Type a specific question in the chat above for more accurate AI responses. The more context you give, the better the output!
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 60, paddingHorizontal: SPACING.base, paddingBottom: SPACING.xl },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  headerIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
  personalityRow: { flexDirection: 'row', gap: SPACING.sm, backgroundColor: COLORS.card, borderRadius: RADIUS.xl, padding: 4 },
  personalityBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: RADIUS.lg },
  personalityBtnActive: { backgroundColor: COLORS.purple },
  personalityText: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontWeight: '600' },
  personalityTextActive: { color: '#fff' },
  content: { padding: SPACING.base, paddingBottom: 100, gap: SPACING.md },
  chatCard: { backgroundColor: COLORS.card, borderRadius: RADIUS['2xl'], padding: SPACING.base, borderWidth: 1, borderColor: COLORS.cardBorder },
  chatCardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  chatCardTitle: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.text },
  chatInput: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    color: COLORS.text,
    fontSize: FONTS.sizes.sm,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  chatBtnRow: { flexDirection: 'row', gap: SPACING.sm },
  chatBtn: { borderRadius: RADIUS.full, overflow: 'hidden' },
  chatBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, paddingHorizontal: SPACING.base },
  chatBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.sm },
  chatBtnOutline: { backgroundColor: COLORS.surface, borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 13, justifyContent: 'center', borderWidth: 1, borderColor: COLORS.cardBorder },
  chatBtnOutlineText: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.text },
  outputCard: { backgroundColor: COLORS.card, borderRadius: RADIUS['2xl'], borderWidth: 1, borderColor: COLORS.cardBorder, overflow: 'hidden' },
  outputHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  outputTitle: { flex: 1, fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.text },
  copyBtn: { padding: 4 },
  outputContent: { padding: SPACING.md },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md },
  loadingText: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
  outputText: { fontSize: FONTS.sizes.sm, color: COLORS.text, lineHeight: 24, whiteSpace: 'pre-wrap' } as any,
  toolsTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text, marginTop: SPACING.sm },
  toolGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  toolCard: {
    width: '47%',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  toolCardActive: { borderColor: COLORS.purple, backgroundColor: COLORS.purpleDim },
  toolIcon: { width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: COLORS.purpleDim, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  toolTitle: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  toolDesc: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, lineHeight: 16 },
  tipCard: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, backgroundColor: 'rgba(251,191,36,0.08)', borderRadius: RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: 'rgba(251,191,36,0.2)' },
  tipText: { flex: 1, fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.7)', lineHeight: 18 },
});
