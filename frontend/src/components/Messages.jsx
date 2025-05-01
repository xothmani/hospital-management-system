import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  getMessages,
  fetchPatients,
  fetchDoctors,
  fetchAllUsers,
  sendMessage,
  markAsRead,
  setSelectedMessages,
} from '../features/messages/messageSlice';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
  Divider,
  CircularProgress,
  Badge,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';

function Messages() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { messages, contacts, selectedMessages, isLoading } = useSelector(
    (state) => state.messages
  );
  const [newMessage, setNewMessage] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);

  // Fetch contacts and conversations on mount
  useEffect(() => {
    dispatch(getMessages()); // Fetch conversations
    if (user.role === 'doctor') {
      dispatch(fetchPatients());
    } else if (user.role === 'patient') {
      dispatch(fetchDoctors());
    } else if (user.role === 'admin') {
      dispatch(fetchAllUsers());
    }
  }, [dispatch, user.role]);

  // Fetch messages for the selected contact
  const fetchMessagesWithContact = async (contactId) => {
    try {
      const token = user.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.get(`/api/messages/${contactId}`, config);
      dispatch(setSelectedMessages(response.data));
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleContactSelect = (contact) => {
    setSelectedContact(contact);
    fetchMessagesWithContact(contact._id);
    // Mark unread messages as read
    const unreadMessages = selectedMessages.filter(
      (msg) => !msg.read && msg.sender._id !== user._id
    );
    unreadMessages.forEach((msg) => dispatch(markAsRead(msg._id)));
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && selectedContact) {
      const messageData = {
        receiverId: selectedContact._id,
        content: newMessage,
      };
      dispatch(sendMessage(messageData));
      setNewMessage('');
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 200px)', gap: 2 }}>
      {/* Contacts List */}
      <Paper sx={{ width: 300, overflow: 'auto' }}>
        <Typography variant="h6" sx={{ p: 2 }}>
          Contacts
        </Typography>
        <Divider />
        <List>
          {contacts.map((contact) => {
            const conversation = messages.find(
              (conv) => conv.user._id === contact._id
            );
            const unreadCount = conversation ? conversation.unreadCount : 0;

            return (
              <ListItem
                key={contact._id}
                button
                selected={selectedContact?._id === contact._id}
                onClick={() => handleContactSelect(contact)}
              >
                <ListItemText
                  primary={
                    <Badge badgeContent={unreadCount} color="error">
                      <Typography>
                        {contact.name}{' '}
                        {contact.role && user.role === 'admin' ? `(${contact.role})` : ''}
                        {contact.specialization && user.role === 'patient'
                          ? `(${contact.specialization})`
                          : ''}
                      </Typography>
                    </Badge>
                  }
                />
              </ListItem>
            );
          })}
        </List>
      </Paper>

      {/* Messages Area */}
      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {selectedContact ? (
            selectedMessages.map((msg) => (
              <Box
                key={msg._id}
                sx={{
                  display: 'flex',
                  justifyContent: msg.sender._id === user._id ? 'flex-end' : 'flex-start',
                  mb: 1,
                }}
              >
                <Paper
                  sx={{
                    p: 1,
                    backgroundColor: msg.sender._id === user._id ? 'primary.light' : 'grey.100',
                    maxWidth: '70%',
                  }}
                >
                  <Typography>{msg.content}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {new Date(msg.createdAt).toLocaleString()}
                  </Typography>
                </Paper>
              </Box>
            ))
          ) : (
            <Typography variant="body1" textAlign="center">
              Select a contact to start messaging
            </Typography>
          )}
        </Box>

        {selectedContact && (
          <Box
            component="form"
            onSubmit={handleSendMessage}
            sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}
          >
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
              />
              <Button
                type="submit"
                variant="contained"
                disabled={!newMessage.trim()}
                endIcon={<SendIcon />}
              >
                Send
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default Messages;