import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, FlatList,Alert, Text, StyleSheet, KeyboardAvoidingView, Platform  } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import { Ionicons } from '@expo/vector-icons';

const Message = ({ route, navigation }) => {
  const [senderId, setSenderId] = useState('');
  const [recepientId, setRecepientId] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]); 
  const { driverId } = route.params || {};

  useEffect(() => {
    const initializeIds = async () => {
      try {
        // Retrieve logged-in user ID from AsyncStorage
        const loggedInUserId = await AsyncStorage.getItem('userId');
        if (loggedInUserId) {
          setSenderId(loggedInUserId);
          console.log("Sender ID from AsyncStorage:", loggedInUserId); // Debug log
        } else {
          console.warn('User ID not found in AsyncStorage.');
        }
  
        // Ensure driverId is passed from route.params
        if (driverId) {
          setRecepientId(driverId);
          console.log('Driver ID from params:', driverId); // Debug log
        } else {
   
          console.error('Driver ID is missing in route params.');
        }
      } catch (error) {
        console.error('Error retrieving IDs:', error);
      }
    };
  
    initializeIds();
  }, [driverId]);
  
  const handleSendMessage = async () => {
    if (!senderId || !recepientId || !message) {

      console.error("Missing Sender ID:", senderId, "Recipient ID:", recepientId, "Message:", message); // Debug log
      return;
    }
  
    try {
      const response = await axios.post('https://melodious-conkies-9be892.netlify.app/.netlify/functions/api/message/send-messages', {
        senderId,
        recepientId,
        message,
      });
  
      console.log("Response from sending message:", response.data); // Debug log
  
      if (response.data.message === 'Message sent successfully') {
       
        setMessage('');  // Clear message input
        fetchMessages();  
      } else {
   
      }
    } catch (error) {
      console.error("Error sending message:", error);
   
    }
  };
  
  // Function to fetch messages
  const fetchMessages = async () => {
    if (!senderId || !recepientId) return;  // Ensure both IDs are available

    try {
      const response = await axios.get(`https://melodious-conkies-9be892.netlify.app/.netlify/functions/api/message/messages/${senderId}/${recepientId}`);
      setMessages(response.data);  // Store messages in state
    } catch (error) {
      console.error("Error fetching messages:", error);

    }
  };

  useEffect(() => {
    if (senderId && recepientId) {
      fetchMessages();  // Fetch messages initially

      // Set an interval to fetch messages every 3 seconds
      const intervalId = setInterval(() => {
        fetchMessages();
      }, 3000);

      // Cleanup interval on component unmount or when senderId/recepientId change
      return () => clearInterval(intervalId);
    }
  }, [senderId, recepientId]);  // Re-run when IDs change

  return (
    <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 100} 
  >
  <View style={{ flex: 1, justifyContent: 'space-between', padding: 20 }}>
    {/* FlatList for displaying messages */}
    <FlatList
      data={messages}
      keyExtractor={(item) => item._id.toString()}
      renderItem={({ item }) => {
        const isSender = item.senderId._id === senderId;
        const isRecipient = item.recepientId === senderId;

        return (
          <View
            style={[
              styles.messageContainer,
              isSender ? styles.sentMessage : styles.receivedMessage
            ]}
          >
            {/* Sender's message (Your message) */}
            {isSender && (
              <>
                <Text
                  style={[
                    styles.message,
                    isSender ? styles.sentMessageText : styles.receivedMessageText
                  ]}
                >
                  {item.message}
                </Text>
              </>
            )}

            {/* Recipient's message (Other person’s message) */}
            {isRecipient && (
              <>
                {/* <Text
                  style={[
                    styles.sender,
                    isRecipient ? styles.receivedSender : styles.sentSender
                  ]}
                >
                  {item.senderId.name}:
                </Text> */}
                <Text
                  style={[
                    styles.message,
                    isRecipient ? styles.receivedMessageText : styles.sentMessageText
                  ]}
                >
                  {item.message}
                </Text>
              </>
            )}
          </View>
        );
      }}
    />

    {/* Message input section at the bottom */}
    <View style={{flexDirection: "row", paddingHorizontal: 20, width: "90%"}}>

      <TextInput
        style={{backgroundColor: "lightgray", padding: 10, width: "100%", borderRadius: 10}}
        value={message}
        onChangeText={setMessage}
        placeholder="Enter your message"
        multiline
      />

<Ionicons style={{ padding: 10,}} onPress={handleSendMessage} name="send" size={30} color="blue" />

    </View>
  </View>
</KeyboardAvoidingView>
  );
};
const styles = StyleSheet.create({
  container: {
    padding: 30,
  },
  messageContainer: {
    flexDirection: 'row', // Align messages side by side
    marginTop: 5,
  },
  sentMessage: {
    justifyContent: 'flex-end', // Aligns sent messages to the right
    alignItems: 'flex-end',
  },
  receivedMessage: {
    justifyContent: 'flex-start', // Aligns received messages to the left
    alignItems: 'flex-start',
  },
  sentSender: {
    color: 'blue', // Customize color for sender label
  },
  receivedSender: {
    color: 'gray', // Customize color for recipient label
  },
  sentMessageText: {
    backgroundColor: 'lightblue', // Sent message background color
    borderRadius: 10,
    padding: 10,
    maxWidth: '70%',
    alignSelf: 'flex-end', // Aligns text to the right
  },
  receivedMessageText: {
    backgroundColor: 'lightgray', // Received message background color
    borderRadius: 10,
    padding: 10,
    maxWidth: '70%',
    alignSelf: 'flex-start', // Aligns text to the left
  },
});

export default Message;
