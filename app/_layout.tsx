
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';

import { useColorScheme } from '@/hooks/useColorScheme';
// Import the initialized auth object
import { auth } from '@/constants/firebaseConfig';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [user, setUser] = useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Make sure we are not in a loading state and auth is initialized.
    if (!loaded || !authInitialized) return;

    const inTabsGroup = segments[0] === '(tabs)';

    if (user && !inTabsGroup) {
      // User is signed in but is not in the main app flow.
      // Redirect to the main app.
      router.replace('/(tabs)/');
    } else if (!user && inTabsGroup) {
      // User is not signed in and is in the main app flow.
      // Redirect to the welcome screen.
      router.replace('/');
    }
  }, [user, loaded, authInitialized, segments, router]);

  // If fonts are not loaded or auth is not initialized,
  // return null to display the splash screen.
  if (!loaded || !authInitialized) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
