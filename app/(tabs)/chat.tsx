
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, Alert, StyleSheet } from 'react-native';
import { getDatabase, ref, onValue, push, serverTimestamp } from 'firebase/database';
import { getAuth } from 'firebase/auth';

interface Message {
  id: string;
  text: string;
  timestamp: number;
  userId: string;
  displayName: string;
}

const ChatScreen = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const auth = getAuth();
  const user = auth.currentUser;
  const db = getDatabase();
  const messagesRef = ref(db, 'messages');

  useEffect(() => {
    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      const loadedMessages: Message[] = [];
      for (const key in data) {
        loadedMessages.push({ id: key, ...data[key] });
      }
      setMessages(loadedMessages.sort((a, b) => a.timestamp - b.timestamp));
    });
  }, []);

  const handleSend = () => {
    if (newMessage.trim() === '' || !user) {
      return;
    }

    const messageData = {
      text: newMessage,
      timestamp: serverTimestamp(),
      userId: user.uid,
      displayName: user.displayName || user.email, // Fallback to email if display name is not set
    };

    push(messagesRef, messageData)
      .then(() => setNewMessage(''))
      .catch((error) => Alert.alert('Error', error.message));
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.userId === user?.uid ? styles.myMessage : styles.theirMessage
    ]}>
      <Text style={styles.messageDisplayName}>{item.displayName}</Text>
      <Text>{item.text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
      />
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Type a message"
          value={newMessage}
          onChangeText={setNewMessage}
          style={styles.input}
        />
        <Button title="Send" onPress={handleSend} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  messageList: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
  },
  messageContainer: {
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#dcf8c6',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
  },
  messageDisplayName: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
    fontWeight: 'bold',
  }
});

export default ChatScreen;
