
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const WelcomeScreen = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Loomi</Text>
      <View style={styles.buttonContainer}>
        <Button title="Sign In" onPress={() => router.push('/sign-in')} />
        <View style={styles.spacer} />
        <Button title="Sign Up" onPress={() => router.push('/sign-up')} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
  },
  spacer: {
    width: 20, // Adjust the space between the buttons
  },
});

export default WelcomeScreen;
