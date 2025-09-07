import { Ionicons } from "@expo/vector-icons";
import * as Notifications from 'expo-notifications';
import { getAuth } from "firebase/auth";
import { getDatabase, onValue, push, ref, set } from "firebase/database";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import NotificationService from '@/constants/notificationService';

interface Message {
  id: string;
  text: string;
  timestamp: number;
  userId: string;
  displayName: string;
  avatar?: string;
}

interface User {
  uid: string;
  displayName?: string;
  email?: string;
  expoPushToken?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ChatScreen = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [inputHeight, setInputHeight] = useState(40);
  const [isTyping, setIsTyping] = useState(false);
  const [users, setUsers] = useState<Record<string, User>>({});
  const flatListRef = useRef<FlatList>(null);
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  
  const auth = getAuth();
  const user = auth.currentUser;
  const db = getDatabase();
  const messagesRef = ref(db, "messages");
  const usersRef = ref(db, "users");

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Theme colors
  const theme = {
    background: isDark ? "#000000" : "#f8f9fa",
    surface: isDark ? "#1a1a1a" : "#ffffff",
    primary: isDark ? "#00d4aa" : "#007AFF",
    primaryLight: isDark ? "#00f5c4" : "#4ba3ff",
    secondary: isDark ? "#2d2d2d" : "#e9ecef",
    text: isDark ? "#ffffff" : "#000000",
    textSecondary: isDark ? "#a0a0a0" : "#6c757d",
    border: isDark ? "#333333" : "#dee2e6",
    myMessage: isDark ? "#00d4aa" : "#007AFF",
    theirMessage: isDark ? "#2d2d2d" : "#e9ecef",
    shadow: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
  };

  // Initialize notifications
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Register for push notifications
        const expoPushToken = await NotificationService.registerForPushNotificationsAsync();
        
        // Setup notification listeners
        NotificationService.setupNotificationListeners();
        
        // Save user's push token to database
        if (user && expoPushToken) {
          await set(ref(db, `users/${user.uid}`), {
            uid: user.uid,
            displayName: user.displayName || user.email?.split('@')[0] || "User",
            email: user.email,
            expoPushToken: expoPushToken,
            lastSeen: Date.now(),
          });
        }
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
        Alert.alert('Notification Error', 'Failed to setup notifications');
      }
    };

    if (user) {
      initializeNotifications();
    }

    // Cleanup listeners on unmount
    return () => {
      NotificationService.removeNotificationListeners();
    };
  }, [user]);

  // Listen for messages
  useEffect(() => {
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      const loadedMessages: Message[] = [];
      if (data) {
        for (const key in data) {
          loadedMessages.push({ id: key, ...data[key] });
        }
        const sortedMessages = loadedMessages.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(sortedMessages);
        
        // Check for new messages from others and show notification
        const lastMessage = sortedMessages[sortedMessages.length - 1];
        if (lastMessage && lastMessage.userId !== user?.uid && messages.length > 0) {
          // Show local notification for new message
          NotificationService.schedulePushNotification(
            `New message from ${lastMessage.displayName}`,
            lastMessage.text,
            { messageId: lastMessage.id, userId: lastMessage.userId },
            1
          );
        }
        
        // Auto-scroll to bottom when new messages arrive
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [user, messages.length]);

  // Listen for users (to get push tokens)
  useEffect(() => {
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUsers(data);
      }
    });

    return () => unsubscribe();
  }, []);

  const sendNotificationToUsers = async (messageText: string, senderName: string) => {
    const currentUserToken = NotificationService.getExpoPushToken();
    
    // Send notifications to all other users
    for (const userId in users) {
      if (userId !== user?.uid && users[userId].expoPushToken) {
        try {
          await NotificationService.sendPushNotification(
            users[userId].expoPushToken,
            `New message from ${senderName}`,
            messageText,
            { 
              senderId: user?.uid,
              senderName: senderName,
              chatId: 'main_chat' 
            }
          );
        } catch (error) {
          console.error(`Failed to send notification to user ${userId}:`, error);
        }
      }
    }
  };

  const handleSend = async () => {
    if (newMessage.trim() === "" || !user) return;

    // Animate send button
    Animated.sequence([
      Animated.timing(sendButtonScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(sendButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    const messageData: Omit<Message, 'id'> = {
      text: newMessage.trim(),
      timestamp: Date.now(),
      userId: user.uid,
      displayName: user.displayName || user.email?.split('@')[0] || "User",
      avatar: user.photoURL || "👤",
    };

    try {
      await push(messagesRef, messageData);
      
      // Send push notifications to other users
      await sendNotificationToUsers(
        messageData.text,
        messageData.displayName
      );
      
      setNewMessage("");
      setInputHeight(40);
      setIsTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert("Error", "Failed to send message");
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handleTextChange = (text: string) => {
    setNewMessage(text);
    setIsTyping(text.length > 0);
  };

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const isMyMessage = item.userId === user?.uid;
    const prevMessage = messages[index - 1];
    const showDisplayName = !prevMessage || prevMessage.userId !== item.userId;
    const isConsecutive = prevMessage && 
      prevMessage.userId === item.userId && 
      (item.timestamp - prevMessage.timestamp) < 60000; // 1 minute

    return (
      <View
        style={[
          styles.messageWrapper,
          isMyMessage ? styles.myMessageWrapper : styles.theirMessageWrapper,
          { marginTop: isConsecutive ? 2 : 12 },
        ]}
      >
        <View
          style={[
            styles.messageContainer,
            isMyMessage ? [styles.myMessage, { backgroundColor: theme.myMessage }] : 
                         [styles.theirMessage, { backgroundColor: theme.theirMessage }],
            {
              borderTopRightRadius: isMyMessage && isConsecutive ? 8 : 18,
              borderTopLeftRadius: !isMyMessage && isConsecutive ? 8 : 18,
              maxWidth: screenWidth * 0.75,
            },
          ]}
        >
          {showDisplayName && !isMyMessage && (
            <Text style={[styles.displayName, { color: theme.primary }]}>
              {item.displayName}
            </Text>
          )}
          <Text style={[styles.messageText, { color: isMyMessage ? "#ffffff" : theme.text }]}>
            {item.text}
          </Text>
          <Text style={[
            styles.timestamp, 
            { color: isMyMessage ? "rgba(255,255,255,0.7)" : theme.textSecondary }
          ]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />
      
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.messageList,
            { minHeight: screenHeight * 0.7 }
          ]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
        
        <View style={[styles.inputContainer, { 
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          paddingBottom: Platform.OS === "ios" ? 20 : 10,
        }]}>
          <View style={[styles.inputWrapper, { 
            backgroundColor: theme.secondary,
            borderColor: isTyping ? theme.primary : theme.border,
            minHeight: Math.max(40, Math.min(inputHeight, 120)),
          }]}>
            <TextInput
              placeholder="Type a message..."
              placeholderTextColor={theme.textSecondary}
              value={newMessage}
              onChangeText={handleTextChange}
              style={[styles.input, { 
                color: theme.text,
                height: Math.max(40, Math.min(inputHeight, 120)),
              }]}
              multiline
              maxLength={1000}
              onContentSizeChange={(event) => 
                setInputHeight(event.nativeEvent.contentSize.height)
              }
              textAlignVertical="center"
            />
            
            <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  {
                    backgroundColor: newMessage.trim() ? theme.primary : theme.border,
                  },
                ]}
                onPress={handleSend}
                disabled={!newMessage.trim()}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={newMessage.trim() ? "send" : "send-outline"}
                  size={20}
                  color={newMessage.trim() ? "#ffffff" : theme.textSecondary}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageWrapper: {
    width: '100%',
  },
  myMessageWrapper: {
    alignItems: 'flex-end',
  },
  theirMessageWrapper: {
    alignItems: 'flex-start',
  },
  messageContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  myMessage: {
    borderBottomRightRadius: 6,
  },
  theirMessage: {
    borderBottomLeftRadius: 6,
  },
  displayName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 6,
    alignSelf: 'flex-end',
    fontWeight: '400',
    opacity: 0.7,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 25,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    paddingVertical: 8,
    paddingRight: 12,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
});

export default ChatScreen;