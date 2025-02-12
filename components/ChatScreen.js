import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PropTypes } from 'prop-types';
import styles from '../src/styles/ChatStyles';
import { firestore } from '../firebaseConfig';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import * as Clipboard from 'expo-clipboard';

const ChatScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params; // Получаване на ID и име на групата от параметрите на навигацията
  const stringGroupId = String(groupId); // Уверяваме се, че ID е стринг за съвместимост
  const [messages, setMessages] = useState([]); // Съхраняване на списъка със съобщения
  const [newMessage, setNewMessage] = useState(''); // Съхраняване на текущо въведеното съобщение
  const [editingMessageId, setEditingMessageId] = useState(null); // ID на съобщението, което се редактира
  const [menuVisible, setMenuVisible] = useState(false); // Състояние за видимост на менюто
  const [menuRotation, setMenuRotation] = useState(0); // Ротация за анимация на менюто
  const flatListRef = useRef(null); // Референция за FlatList за автоматично скролиране
  const userId = getAuth().currentUser.uid; // Получаване на текущия потребител от Firebase Authentication

  // Зареждане на съобщенията в реално време
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(firestore, 'groups', stringGroupId, 'messages'), // Референция към колекцията със съобщения
      (snapshot) => {
        const loadedMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })).sort((a, b) => a.timestamp - b.timestamp); // Сортиране на съобщенията по времева отметка
        setMessages(loadedMessages); // Актуализация на state със заредените съобщения
      },
      (error) => {
        console.error("Error fetching messages:", error.code, error.message);
      }
    );

    return () => unsubscribe(); // Премахване на слушателя при напускане на компонента
  }, [stringGroupId]);

  const sendMessage = async () => {
    if (newMessage.trim() === '') return;

    const messageData = {
      text: newMessage,
      timestamp: new Date(),
      userId: userId,
    };

    if (editingMessageId) {
      await updateDoc(doc(firestore, 'groups', stringGroupId, 'messages', editingMessageId), messageData);
      setEditingMessageId(null);
    } else {
      await addDoc(collection(firestore, 'groups', stringGroupId, 'messages'), messageData);
    }

    setNewMessage('');
  };

  const handleLongPress = (messageId) => {
    const message = messages.find(msg => msg.id === messageId);
    if (message) {
      const options = [
        {
          text: "Copy",
          onPress: () => handleCopy(message.text),
        },
        { text: "Cancel", style: "cancel" },
      ];

      if (message.userId === userId) {
        options.splice(1, 0, {
          text: "Edit",
          onPress: () => handleEdit(message),
        });
        options.splice(2, 0, {
          text: "Delete",
          onPress: () => handleDelete(messageId),
        });
      }

      Alert.alert(
        "Select Action",
        "Choose an action",
        options
      );
    }
  };

  const handleCopy = async (text) => {
    await Clipboard.setString(text);
  };

  const handleEdit = (message) => {
    setEditingMessageId(message.id);
    setNewMessage(message.text);
  };

  const handleDelete = async (messageId) => {
    try {
      await deleteDoc(doc(firestore, 'groups', stringGroupId, 'messages', messageId));
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.userId === userId;
    return (
      <TouchableOpacity 
        onLongPress={() => handleLongPress(item.id)} 
        style={styles.messageContainer}
      >
        {!isMyMessage && (
          <View style={styles.iconContainer}>
            <Ionicons 
              name="person-circle-outline"
              size={30}
              color="black"
              style={styles.profileIcon}
            />
          </View>
        )}

        <View style={[styles.messageItem, isMyMessage ? styles.myMessage : styles.otherMessage]}>
          <Text style={styles.messageText}>{item.text}</Text>
        </View>

        {isMyMessage && (
          <View style={styles.iconContainer}>
            <Ionicons 
              name="person-circle-outline"
              size={30}
              color="black"
              style={styles.profileIcon}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const toggleMenu = () => {
    setMenuVisible(prev => !prev);
    setMenuRotation(prev => (prev === 0 ? 90 : 0));
  };

  const showGalleryAlert = () => {
    Alert.alert('Gallery feature coming soon!');
  };

  const showVoiceAlert = () => {
    Alert.alert('Voice message feature coming soon!');
  };

  const showCameraAlert = () => {
    Alert.alert('Camera functionality coming soon!');
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleMenu} style={{ marginTop: 30 }}>
          <Ionicons 
            name="menu" 
            size={24} 
            color="white" 
            style={{ transform: [{ rotate: `${menuRotation}deg` }] }} 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{groupName}</Text>
      </View>

      {menuVisible && (
        <View style={styles.dropdownMenu}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.menuItem}>Профил</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Guest group chat functionality coming soon!')}>
            <Text style={styles.menuItem}>Членове и гости</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={showGalleryAlert}>
            <Text style={styles.menuItem}>Галерия</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Notifications feature coming soon!')}>
            <Text style={styles.menuItem}>Новини и известия</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Marketplace feature coming soon!')}>
            <Text style={styles.menuItem}>Канал за покупко-продажба</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Lost & Found feature coming soon!')}>
            <Text style={styles.menuItem}>Канал за загубени/намерени кучета</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Main')}>
            <Text style={styles.menuItem}>Обратно към Main</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messageList}
        onContentSizeChange={scrollToBottom}
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={showGalleryAlert}>
          <Ionicons name="image" size={30} color="black" style={styles.icon} />
        </TouchableOpacity>

        <TouchableOpacity onPress={showCameraAlert}>
          <Ionicons name="camera" size={30} color="black" style={styles.icon} />
        </TouchableOpacity>

        <TouchableOpacity onPress={showVoiceAlert}>
          <Ionicons name="mic" size={30} color="black" style={styles.icon} />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Type a message"
          value={newMessage}
          onChangeText={setNewMessage}
          onSubmitEditing={sendMessage}
        />

        <TouchableOpacity onPress={sendMessage}>
          <Ionicons name="send" size={30} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

ChatScreen.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      groupId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      groupName: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

export default ChatScreen;
