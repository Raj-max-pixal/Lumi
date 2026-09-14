import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

type TabId = "home" | "explore" | "snaps" | "chat" | "profile";
type ThemeId = "nightNeon" | "oceanGlass" | "midnightBlue";

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "home", label: "Home" },
  { id: "explore", label: "Explore" },
  { id: "snaps", label: "Snaps" },
  { id: "chat", label: "Chat" },
  { id: "profile", label: "Profile" }
];

const themes = {
  nightNeon: {
    bg: "#050505",
    panel: "rgba(255,255,255,0.06)",
    accent: "#A855F7",
    text: "#FFFFFF",
    subtext: "rgba(255,255,255,0.72)"
  },
  oceanGlass: {
    bg: "#dff6fc",
    panel: "#ffffff",
    accent: "#6bc9ea",
    text: "#0f172a",
    subtext: "#64748b"
  },
  midnightBlue: {
    bg: "#08111f",
    panel: "rgba(255,255,255,0.05)",
    accent: "#3b82f6",
    text: "#FFFFFF",
    subtext: "rgba(255,255,255,0.70)"
  }
} as const;

function SectionCard({
  title,
  body,
  theme
}: {
  title: string;
  body: string;
  theme: (typeof themes)[ThemeId];
}) {
  return (
    <View style={[styles.card, { backgroundColor: theme.panel }]}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.cardBody, { color: theme.subtext }]}>{body}</Text>
    </View>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [themeId, setThemeId] = useState<ThemeId>("nightNeon");

  const theme = themes[themeId];

  const content = useMemo(() => {
    if (activeTab === "explore") {
      return [
        {
          title: "Trending Creators",
          body: "Instagram-style discovery grid with creator cards, stories, and category chips."
        },
        {
          title: "Nearby + Location",
          body: "Maps, local community moments, and regional discovery surfaces."
        }
      ];
    }

    if (activeTab === "snaps") {
      return [
        {
          title: "Camera + Filters",
          body: "Prepare the native camera stack with filters, stories, snaps, and streaks."
        },
        {
          title: "Avatar + Streaks",
          body: "Snap-inspired identity layer with close-friends momentum and daily streak tracking."
        }
      ];
    }

    if (activeTab === "chat") {
      return [
        {
          title: "Chats",
          body: "WhatsApp + Telegram style threads, media, smart replies, and disappearing messages."
        },
        {
          title: "Voice + Groups",
          body: "Voice notes, channels, groups, reactions, and creator broadcast spaces."
        }
      ];
    }

    if (activeTab === "profile") {
      return [
        {
          title: "Profile",
          body: "Posts, reels, followers, following, editable bio, stats, and creator identity."
        },
        {
          title: "Analytics",
          body: "Follower growth, engagement, and best-time-to-post insights."
        }
      ];
    }

    return [
      {
        title: "Home Feed",
        body: "Instagram-first vertical social feed with stories, posts, reels, likes, saves, and comments."
      },
      {
        title: "AI Hub",
        body: "Free AI tools for captions, feed control, moderation, replies, and creator assistance."
      }
    ];
  }, [activeTab]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar style={themeId === "oceanGlass" ? "dark" : "light"} />
      <View style={styles.wrapper}>
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.kicker, { color: theme.accent }]}>Lumi Mobile</Text>
            <Text style={[styles.title, { color: theme.text }]}>Social app shell ready for Android integration</Text>
          </View>
          <Pressable
            style={[styles.themeButton, { backgroundColor: theme.panel }]}
            onPress={() =>
              setThemeId((current) =>
                current === "nightNeon" ? "oceanGlass" : current === "oceanGlass" ? "midnightBlue" : "nightNeon"
              )
            }
          >
            <Text style={{ color: theme.text, fontWeight: "700" }}>
              {themeId === "nightNeon" ? "Night Neon" : themeId === "oceanGlass" ? "Ocean Glass" : "Midnight Blue"}
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.hero, { backgroundColor: theme.panel }]}>
            <Text style={[styles.heroTitle, { color: theme.text }]}>
              Instagram 50%, WhatsApp chat, Snapchat snaps, Telegram groups, Threads text, and creator-first social energy.
            </Text>
            <Text style={[styles.heroBody, { color: theme.subtext }]}>
              This Expo shell mirrors the web app architecture and gives you a mobile-ready direction for Play Store packaging.
            </Text>
          </View>

          {content.map((item) => (
            <SectionCard key={item.title} title={item.title} body={item.body} theme={theme} />
          ))}
        </ScrollView>

        <View style={[styles.bottomNav, { backgroundColor: theme.panel }]}>
          {tabs.map((tab) => (
            <Pressable key={tab.id} style={styles.tabItem} onPress={() => setActiveTab(tab.id)}>
              <Text
                style={{
                  color: activeTab === tab.id ? theme.accent : theme.subtext,
                  fontWeight: activeTab === tab.id ? "700" : "500"
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  wrapper: {
    flex: 1,
    padding: 20,
    gap: 16
  },
  topRow: {
    gap: 12
  },
  kicker: {
    fontSize: 16,
    fontWeight: "700"
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700",
    marginTop: 8
  },
  themeButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  content: {
    gap: 16,
    paddingBottom: 16
  },
  hero: {
    borderRadius: 28,
    padding: 20
  },
  heroTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700"
  },
  heroBody: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 24
  },
  card: {
    borderRadius: 24,
    padding: 18
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700"
  },
  cardBody: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 28,
    paddingHorizontal: 10,
    paddingVertical: 12
  },
  tabItem: {
    flex: 1,
    alignItems: "center"
  }
});
