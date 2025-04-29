import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getMessages, sendMessage, markAsRead } from '../features/messages/messageSlice';
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
  const { messages, isLoading } = useSelector((state) => state.messages);
  const [newMessage, setNewMessage] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);

  useEffect(() => {
    dispatch(getMessages());
  }, [dispatch]);

  // Get unique contacts based on user role
  const getUniqueContacts = () => {
    const uniqueContacts = new Map();
    messages.forEach((msg) => {
      const contact = user.role === 'doctor' ? msg.patient : msg.doctor;
      if (contact) {
        uniqueContacts.set(contact._id, contact);
      }
    });
    return Array.from(uniqueContacts.values());
  };

  // Filter messages for selected contact
  const filteredMessages = selectedContact
    ? messages.filter((msg) =>
        user.role === 'doctor'
          ? msg.patient?._id === selectedContact._id
          : msg.doctor?._id === selectedContact._id
      )
    : [];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && selectedContact) {
      const messageData = {
        content: newMessage,
        recipientId: selectedContact._id,
        recipientRole: user.role === 'doctor' ? 'patient' : 'doctor',
      };
      dispatch(sendMessage(messageData));
      setNewMessage('');
    }
  };

  const handleContactSelect = (contact) => {
    setSelectedContact(contact);
    // Mark unread messages as read
    filteredMessages
      .filter((msg) => !msg.isRead && msg.sender._id !== user._id)
      .forEach((msg) => dispatch(markAsRead(msg._id)));
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
          {getUniqueContacts().map((contact) => {
            const unreadCount = messages.filter(
              (msg) =>
                !msg.isRead &&
                msg.sender._id === contact._id &&
                ((user.role === 'doctor' && msg.patient?._id === contact._id) ||
                  (user.role === 'patient' && msg.doctor?._id === contact._id))
            ).length;

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
                      <Typography>{contact.name}</Typography>
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
            filteredMessages.map((msg) => (
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