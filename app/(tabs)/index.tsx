
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { auth } from '@/constants/firebaseConfig';
import { signOut } from 'firebase/auth';

const HomeScreen = () => {
    const user = auth.currentUser;

    const handleSignOut = () => {
        signOut(auth).catch(error => console.error("Sign out error", error));
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.email}>{user?.displayName || user?.email}</Text>
            <Button title="Sign Out" onPress={handleSignOut} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    email: {
        fontSize: 18,
        marginBottom: 20,
    },
});

export default HomeScreen;
