import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ref, onValue, push, set, get } from 'firebase/database';
import { realtimeDb } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { COLORS, RADIUS, SPACING, FONTS } from '../config/theme';
import type { ChatPerson, ChatMessage } from '../types';

export default function ChatScreen() {
  const { user } = useAuth();
  const [people, setPeople] = useState<ChatPerson[]>([]);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingPeople, setLoadingPeople] = useState(true);
  const listRef = useRef<FlatList>(null);

  const roomId = useMemo(() => {
    if (!user || !targetId) return null;
    return [user.id, targetId].sort().join('_');
  }, [user?.id, targetId]);

  const selectedPerson = people.find((p) => p.id === targetId);

  useEffect(() => {
    const unsub = onValue(ref(realtimeDb, 'publicProfiles'), (snap) => {
      const val = snap.val() as Record<string, Omit<ChatPerson, 'id'>> | null;
      setPeople(
        Object.entries(val || {})
          .filter(([id]) => id !== user?.id)
          .map(([id, p]) => ({
            id,
            name: p.name || 'Lumi Dev',
            avatar: p.avatar || `https://api.dicebear.com/9.x/notionists/svg?seed=${id}`,
            username: p.username,
          }))
          .filter((p) => p.name)
      );
      setLoadingPeople(false);
    }, () => setLoadingPeople(false));
    return () => unsub();
  }, [user?.id]);

  useEffect(() => {
    if (!roomId) { setMessages([]); return; }
    const messagesRef = ref(realtimeDb, `directMessages/${roomId}/messages`);
    const unsub = onValue(messagesRef, (snap) => {
      const val = snap.val() as Record<string, Omit<ChatMessage, 'id'>> | null;
      setMessages(
        Object.entries(val || {})
          .map(([id, m]) => ({ id, ...m }))
          .sort((a, b) => a.createdAt - b.createdAt)
      );
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return () => unsub();
  }, [roomId]);

  async function openConversation(personId: string) {
    if (!user) return;
    const rId = [user.id, personId].sort().join('_');
    const roomRef = ref(realtimeDb, `directMessages/${rId}`);
    const existing = await get(roomRef);
    if (!existing.exists()) {
      await set(roomRef, {
        creatorId: user.id,
        peerId: personId,
        participants: { [user.id]: true, [personId]: true },
      });
    }
    setTargetId(personId);
    Keyboard.dismiss();
  }

  async function sendMessage() {
    const text = draft.trim();
    if (!user || !roomId || !targetId || !text || sending) return;
    setSending(true);
    try {
      await set(push(ref(realtimeDb, `directMessages/${roomId}/messages`)), {
        senderId: user.id,
        text,
        createdAt: Date.now(),
      });
      setDraft('');
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } finally {
      setSending(false);
    }
  }

  if (!user) {
    return (
      <View style={styles.guestContainer}>
        <LinearGradient colors={['#1a0533', '#050505']} style={StyleSheet.absoluteFill} />
        <Ionicons name="chatbubbles" size={64} color={COLORS.purpleDim} />
        <Text style={styles.guestTitle}>Messages</Text>
        <Text style={styles.guestDesc}>Sign in to send and receive messages from developers around the world.</Text>
      </View>
    );
  }

  if (targetId && selectedPerson) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {/* Chat Header */}
        <LinearGradient colors={['#050505', 'transparent']} style={styles.chatHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setTargetId(null)}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Image source={{ uri: selectedPerson.avatar }} style={styles.chatAvatar} />
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatHeaderName}>{selectedPerson.name}</Text>
            <Text style={styles.chatHeaderHandle}>
              {selectedPerson.username || `@${selectedPerson.id.slice(0, 8)}`}
            </Text>
          </View>
          <View style={styles.onlineDot} />
        </LinearGradient>

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ paddingTop: 100, paddingBottom: 20, paddingHorizontal: SPACING.base, gap: SPACING.sm }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isMe = item.senderId === user.id;
            return (
              <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
                {!isMe && (
                  <Image source={{ uri: selectedPerson.avatar }} style={styles.msgAvatar} />
                )}
                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                  <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
                    {item.text}
                  </Text>
                  <Text style={styles.msgTime}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyChatMsg}>
              <Text style={styles.emptyChatText}>Start the conversation with {selectedPerson.name}! 👋</Text>
            </View>
          }
        />

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.msgInput}
            value={draft}
            onChangeText={setDraft}
            placeholder={`Message ${selectedPerson.name}...`}
            placeholderTextColor={COLORS.textDim}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!draft.trim() || sending) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!draft.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // People list
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#050505', 'transparent']} style={styles.listHeader}>
        <Text style={styles.listTitle}>Messages</Text>
        <Text style={styles.listSub}>Direct messages with other developers</Text>
      </LinearGradient>

      <FlatList
        data={people}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ paddingTop: 120, paddingBottom: 100, paddingHorizontal: SPACING.base, gap: 2 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.personRow}
            onPress={() => openConversation(item.id)}
            activeOpacity={0.75}
          >
            <Image source={{ uri: item.avatar }} style={styles.personAvatar} />
            <View style={styles.personInfo}>
              <Text style={styles.personName}>{item.name}</Text>
              <Text style={styles.personHandle}>
                {item.username || `@${item.id.slice(0, 8)}`}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textDim} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          loadingPeople ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={COLORS.purple} />
            </View>
          ) : (
            <View style={styles.centered}>
              <Ionicons name="people-outline" size={48} color={COLORS.purpleDim} />
              <Text style={styles.emptyText}>No other developers yet</Text>
              <Text style={styles.emptyDesc}>Once people join Lumi, you can message them here.</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  guestContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md, padding: SPACING['2xl'] },
  guestTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.white },
  guestDesc: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },
  listHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingTop: 54, paddingHorizontal: SPACING.base, paddingBottom: SPACING.base },
  listTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.white },
  listSub: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginTop: 2 },
  personRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md, backgroundColor: COLORS.card, borderRadius: RADIUS.xl, marginBottom: 2 },
  personAvatar: { width: 48, height: 48, borderRadius: 24 },
  personInfo: { flex: 1 },
  personName: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.text },
  personHandle: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  chatHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingTop: 50, paddingBottom: SPACING.md, paddingHorizontal: SPACING.base, flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  backBtn: { padding: 4 },
  chatAvatar: { width: 40, height: 40, borderRadius: 20 },
  chatHeaderInfo: { flex: 1 },
  chatHeaderName: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.text },
  chatHeaderHandle: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.success, borderWidth: 2, borderColor: COLORS.bg },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm, maxWidth: '85%' },
  msgRowRight: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  msgRowLeft: { alignSelf: 'flex-start' },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, marginBottom: 16 },
  bubble: { padding: SPACING.md, borderRadius: RADIUS.xl, maxWidth: '100%' },
  bubbleMe: { backgroundColor: COLORS.purple, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: FONTS.sizes.sm, lineHeight: 20 },
  bubbleTextMe: { color: '#fff' },
  bubbleTextThem: { color: COLORS.text },
  msgTime: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4, alignSelf: 'flex-end' },
  emptyChatMsg: { paddingTop: 80, alignItems: 'center' },
  emptyChatText: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, textAlign: 'center' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: SPACING.base, gap: SPACING.md, backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.cardBorder },
  msgInput: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, color: COLORS.text, fontSize: FONTS.sizes.sm, maxHeight: 120 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.purple, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.5 },
  centered: { alignItems: 'center', paddingTop: 60, gap: SPACING.md },
  emptyText: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.text },
  emptyDesc: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, textAlign: 'center', paddingHorizontal: 40 },
});
