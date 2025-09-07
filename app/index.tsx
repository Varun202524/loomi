// WelcomeScreen.tsx (Enhanced)
import React from 'react';
import { View, Text, StyleSheet, StatusBar, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedButton } from '@/components/ThemedButton';
import { useTheme } from '@/hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';

const WelcomeScreen = () => {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <LinearGradient
        colors={isDark ? [colors.background, colors.surface] : [colors.surface, colors.background]}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Welcome to</Text>
          <Text style={[styles.appName, { color: colors.primary }]}>Loomi</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Your journey starts here
          </Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <ThemedButton
            title="Sign In"
            onPress={() => router.push('/sign-in')}
            variant="primary"
            style={styles.button}
          />
          <ThemedButton
            title="Sign Up"
            onPress={() => router.push('/sign-up')}
            variant="secondary"
            style={styles.button}
          />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    marginBottom: 8,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
    paddingHorizontal: 20,
  },
  button: {
    width: '100%',
  },
});

export default WelcomeScreen;