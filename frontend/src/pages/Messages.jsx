import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
  Container,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  IconButton,
  Badge,
  Box,
  Divider,
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

function Messages() {
  const { user } = useSelector((state) => state.auth);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchConversations();
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Check for new messages every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser._id);
    }
  }, [selectedUser]);

  const fetchConversations = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const response = await axios.get('/api/messages/conversations', config);
      setConversations(response.data);
    } catch (error) {
      toast.error('Error fetching conversations');
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const response = await axios.get('/api/messages/unread/count', config);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const response = await axios.get(`/api/messages/${userId}`, config);
      setMessages(response.data);
      markMessagesAsRead(response.data);
    } catch (error) {
      toast.error('Error fetching messages');
    }
  };

  const markMessagesAsRead = async (messages) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const unreadMessages = messages.filter(
        (msg) => !msg.read && msg.receiver._id === user._id
      );
      await Promise.all(
        unreadMessages.map((msg) =>
          axios.put(`/api/messages/${msg._id}/read`, {}, config)
        )
      );
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const response = await axios.post(
        '/api/messages',
        {
          receiverId: selectedUser._id,
          content: newMessage,
        },
        config
      );
      setMessages([...messages, response.data]);
      setNewMessage('');
      fetchConversations(); // Update conversation list
    } catch (error) {
      toast.error('Error sending message');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ height: '70vh', overflow: 'auto' }}>
            <Typography variant="h6" sx={{ p: 2 }}>
              Conversations
            </Typography>
            <Divider />
            <List>
              {conversations.map((conv) => (
                <ListItem
                  key={conv.user._id}
                  button
                  selected={selectedUser?._id === conv.user._id}
                  onClick={() => setSelectedUser(conv.user)}
                >
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={conv.user.name}
                    secondary={conv.lastMessage.content}
                  />
                  {conv.unreadCount > 0 && (
                    <Badge badgeContent={conv.unreadCount} color="primary" />
                  )}
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
            {selectedUser ? (
              <>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="h6">{selectedUser.name}</Typography>
                </Box>
                <Box
                  sx={{
                    p: 2,
                    flexGrow: 1,
                    overflow: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {messages.map((message) => (
                    <Box
                      key={message._id}
                      sx={{
                        alignSelf:
                          message.sender._id === user._id
                            ? 'flex-end'
                            : 'flex-start',
                        backgroundColor:
                          message.sender._id === user._id
                            ? 'primary.main'
                            : 'grey.200',
                        color:
                          message.sender._id === user._id ? 'white' : 'inherit',
                        p: 1,
                        borderRadius: 1,
                        maxWidth: '70%',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body1">{message.content}</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                <Box
                  component="form"
                  onSubmit={sendMessage}
                  sx={{
                    p: 2,
                    borderTop: 1,
                    borderColor: 'divider',
                    display: 'flex',
                  }}
                >
                  <TextField
                    fullWidth
                    size="small"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    sx={{ mr: 1 }}
                  />
                  <IconButton type="submit" color="primary">
                    <SendIcon />
                  </IconButton>
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="h6" color="textSecondary">
                  Select a conversation to start messaging
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Messages;