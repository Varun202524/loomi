import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";
import { getAuth, updateProfile } from "firebase/auth";

const ProfileScreen = () => {
  const auth = getAuth();
  const user = auth.currentUser;

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [email] = useState(user?.email || "");
  const [selectedAvatar, setSelectedAvatar] = useState(user?.photoURL || "👤");
  const [loading, setLoading] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Predefined avatar options
  const avatarOptions = [
    "👤", "👨", "👩", "🧑", "👨‍💼", "👩‍💼", "👨‍🎓", "👩‍🎓",
    "👨‍💻", "👩‍💻", "👨‍🔬", "👩‍🔬", "👨‍🎨", "👩‍🎨", "👨‍🍳", "👩‍🍳",
    "🦸‍♂️", "🦸‍♀️", "🧙‍♂️", "🧙‍♀️", "🦊", "🐱", "🐶", "🐻",
    "🐸", "🐧", "🦀", "🐙", "🌟", "⭐", "🎭", "🎨"
  ];

  // Select avatar
  const selectAvatar = (avatar) => {
    setSelectedAvatar(avatar);
    setShowAvatarModal(false);
  };

  // Update profile
  const handleUpdate = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateProfile(user, { 
        displayName, 
        photoURL: selectedAvatar 
      });
      Alert.alert("Success", "Profile updated!");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Avatar Display */}
      <TouchableOpacity 
        onPress={() => setShowAvatarModal(true)} 
        style={styles.avatarContainer}
      >
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{selectedAvatar}</Text>
        </View>
        <Text style={styles.changeAvatarText}>Tap to change avatar</Text>
      </TouchableOpacity>

      {/* Email Field */}
      <Text style={styles.label}>Email</Text>
      <Text style={styles.value}>{email}</Text>

      {/* Display Name Field */}
      <Text style={styles.label}>Display Name</Text>
      <TextInput
        style={styles.input}
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Enter display name"
      />

      {/* Update Button */}
      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleUpdate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Update Profile</Text>
        )}
      </TouchableOpacity>

      {/* Avatar Selection Modal */}
      <Modal
        visible={showAvatarModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Choose an Avatar</Text>
            
            <ScrollView style={styles.avatarGrid} showsVerticalScrollIndicator={false}>
              <View style={styles.avatarRow}>
                {avatarOptions.map((avatar, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.avatarOption,
                      selectedAvatar === avatar && styles.selectedAvatarOption
                    ]}
                    onPress={() => selectAvatar(avatar)}
                  >
                    <Text style={styles.avatarOptionText}>{avatar}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAvatarModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  avatarContainer: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
    borderWidth: 2,
    borderColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 40,
  },
  changeAvatarText: {
    fontSize: 12,
    color: "#007AFF",
    marginTop: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 16,
    alignSelf: "flex-start",
  },
  value: {
    fontSize: 16,
    marginBottom: 12,
    alignSelf: "flex-start",
    color: "#666",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginTop: 4,
  },
  button: {
    width: "100%",
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 8,
    marginTop: 24,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  avatarGrid: {
    maxHeight: 300,
  },
  avatarRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  avatarOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    margin: 6,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedAvatarOption: {
    borderColor: "#007AFF",
    backgroundColor: "#e3f2fd",
  },
  avatarOptionText: {
    fontSize: 24,
  },
  closeButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ProfileScreen;