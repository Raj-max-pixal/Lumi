import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Text,
  Platform,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Context
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import AILabScreen from './src/screens/AILabScreen';
import HackathonScreen from './src/screens/HackathonScreen';
import ChatScreen from './src/screens/ChatScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import DevClipsScreen from './src/screens/DevClipsScreen';
import AuthScreen from './src/screens/AuthScreen';

// Components
import BottomTabBar from './src/components/BottomTabBar';

// Theme
import { COLORS } from './src/config/theme';

type Tab = 'Home' | 'Explore' | 'AILab' | 'Hackathon' | 'Chat' | 'Profile';

// ─── Splash Screen ───────────────────────────────────────────────────────────
function SplashScreen() {
  return (
    <LinearGradient
      colors={['#1a0533', '#0d0521', '#050505']}
      style={styles.splash}
    >
      <LinearGradient
        colors={[COLORS.purple, COLORS.cyan]}
        style={styles.splashIcon}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="code-slash" size={48} color="#fff" />
      </LinearGradient>
      <Text style={styles.splashTitle}>Lumi</Text>
      <Text style={styles.splashTagline}>For Developers, By Developers</Text>
      <ActivityIndicator
        size="small"
        color={COLORS.purple}
        style={{ marginTop: 48 }}
      />
    </LinearGradient>
  );
}

// ─── Main App Shell ──────────────────────────────────────────────────────────
function AppShell() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('Home');
  const [showAuth, setShowAuth] = useState(false);

  // If user is not signed in and they tap Chat/Profile, show auth
  useEffect(() => {
    if (!user && (activeTab === 'Chat' || activeTab === 'Profile')) {
      setShowAuth(true);
    } else {
      setShowAuth(false);
    }
  }, [user, activeTab]);

  if (isLoading) {
    return <SplashScreen />;
  }

  // If user not signed in and navigated to auth-required tab, show auth screen
  if (!user && showAuth) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <AuthScreen />
        <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </SafeAreaView>
    );
  }

  function renderScreen() {
    switch (activeTab) {
      case 'Home':
        return <HomeScreen />;
      case 'Explore':
        return <ExploreScreen />;
      case 'AILab':
        return <AILabScreen />;
      case 'Hackathon':
        return <HackathonScreen />;
      case 'Chat':
        return <ChatScreen />;
      case 'Profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      {renderScreen()}
      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </SafeAreaView>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashIcon: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  splashTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -2,
  },
  splashTagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
    fontWeight: '500',
  },
});
