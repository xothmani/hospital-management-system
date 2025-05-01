import { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  getConversations, 
  getMessagesWith, 
  sendMessage, 
  markAsRead 
} from '../features/messages/messageSlice';
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
  Avatar,
  InputAdornment,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Send as SendIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  ClearAll as ClearAllIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';

function Messages() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { messages, conversations, isLoading } = useSelector((state) => state.messages);
  
  const [newMessage, setNewMessage] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (error) {
      setShowError(true);
    }
  }, [error]);

  // Fetch conversations on component mount
  useEffect(() => {
    dispatch(getConversations());
    
    // Fetch contacts based on user role
    const fetchContacts = async () => {
      try {
        setLoadingContacts(true);
        setError(null);
        const token = user.token;
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
        
        // Define the API endpoint based on user role
        let endpoint;
        
        if (user.role === 'doctor') {
          // For doctors, use the patient messaging endpoint
          endpoint = '/api/patients/for-messaging';
        } else if (user.role === 'patient') {
          // For patients, use the doctor list endpoint
          endpoint = '/api/doctors';
        } else if (user.role === 'admin') {
          // For admin, use the users endpoint
          endpoint = '/api/users';
        } else {
          // Default to users endpoint for other roles
          endpoint = '/api/users';
        }
        
        const response = await axios.get(endpoint, config);
        
        // Filter out the current user from the contacts list
        const filteredContacts = response.data.filter(
          contact => contact._id !== user._id
        );
        
        setContacts(filteredContacts);
        setLoadingContacts(false);
      } catch (error) {
        console.error('Error fetching contacts:', error);
        setLoadingContacts(false);
        setError(error.response?.data?.message || 'Failed to load contacts. Please try again.');
      }
    };
    
    fetchContacts();
  }, [dispatch, user]);

  // When a contact is selected, fetch the conversation history with that user
  useEffect(() => {
    if (selectedContact) {
      dispatch(getMessagesWith(selectedContact._id));
    }
  }, [dispatch, selectedContact]);

  // Get filtered contacts based on search term
  const getFilteredContacts = () => {
    if (!contacts || contacts.length === 0) return [];
    
    // First filter by search term
    let filtered = contacts.filter(contact => 
      contact.name && contact.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Then apply role-specific filtering if needed
    if (user.role === 'doctor') {
      // For doctors, show only patients
      filtered = filtered.filter(contact => contact.role === 'patient');
    } else if (user.role === 'patient') {
      // For patients, show only doctors
      filtered = filtered.filter(contact => contact.role === 'doctor');
    } else if (user.role === 'admin') {
      // Admin can see everyone
      filtered = filtered;
    } else {
      // For other staff, may want to restrict to admin only
      filtered = filtered.filter(contact => contact.role === 'admin');
    }
    
    return filtered;
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && selectedContact) {
      const messageData = {
        content: newMessage,
        receiverId: selectedContact._id
      };
      dispatch(sendMessage(messageData));
      setNewMessage('');
    }
  };

  const handleContactSelect = (contact) => {
    setSelectedContact(contact);
    
    // Mark unread messages from this contact as read
    if (messages) {
      messages
        .filter(msg => 
          !msg.read && 
          msg.sender._id === contact._id && 
          msg.receiver._id === user._id
        )
        .forEach(msg => dispatch(markAsRead(msg._id)));
    }
  };

  const getAvatarColor = (role) => {
    const colors = {
      admin: '#8e24aa',   // purple
      doctor: '#1976d2',  // blue
      patient: '#43a047', // green
      nurse: '#d81b60',   // pink
      staff: '#f57c00'    // orange
    };
    return colors[role] || '#757575'; // default gray
  };

  const getRoleInitial = (role) => {
    const initials = {
      admin: 'A',
      doctor: 'D',
      patient: 'P',
      nurse: 'N',
      staff: 'S'
    };
    return initials[role] || '?';
  };

  // Function to find unread count for a contact
  const getUnreadCount = (contactId) => {
    if (!conversations) return 0;
    
    const conversation = conversations.find(conv => conv.user._id === contactId);
    return conversation ? conversation.unreadCount : 0;
  };

  // Function to close error alert
  const handleCloseError = () => {
    setShowError(false);
    setError(null);
  };

  // Function to reload contacts
  const handleRefreshContacts = () => {
    const fetchContacts = async () => {
      try {
        setLoadingContacts(true);
        setError(null);
        
        const token = user.token;
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
        
        // Define the API endpoint based on user role
        let endpoint;
        
        if (user.role === 'doctor') {
          // For doctors, use the patient messaging endpoint
          endpoint = '/api/patients/for-messaging';
        } else if (user.role === 'patient') {
          // For patients, use the doctor list endpoint
          endpoint = '/api/doctors';
        } else if (user.role === 'admin') {
          // For admin, use the users endpoint
          endpoint = '/api/users';
        } else {
          // Default to users endpoint for other roles
          endpoint = '/api/users';
        }
        
        const response = await axios.get(endpoint, config);
        
        // Filter out the current user from the contacts list
        const filteredContacts = response.data.filter(
          contact => contact._id !== user._id
        );
        
        setContacts(filteredContacts);
        setLoadingContacts(false);
      } catch (error) {
        console.error('Error fetching contacts:', error);
        setLoadingContacts(false);
        setError(error.response?.data?.message || 'Failed to load contacts. Please try again.');
      }
    };
    
    fetchContacts();
  };

  if (isLoading && !conversations) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 200px)', gap: 2 }}>
      {/* Error Snackbar */}
      <Snackbar 
        open={showError} 
        autoHideDuration={6000} 
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Contacts List */}
      <Paper sx={{ width: 320, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider'
        }}>
          <Typography variant="h6">
            {user.role === 'doctor' ? 'My Patients' : 
             user.role === 'patient' ? 'My Doctors' : 
             'Contacts'}
          </Typography>
          <IconButton 
            size="small" 
            onClick={handleRefreshContacts} 
            disabled={loadingContacts}
            title="Refresh contacts"
          >
            <RefreshIcon />
          </IconButton>
        </Box>
        
        {/* Search tool */}
        <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton 
                    size="small" 
                    onClick={() => setSearchTerm('')}
                    edge="end"
                  >
                    <ClearAllIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Box>
        
        {/* Contact List */}
        <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
          {loadingContacts ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress size={24} />
            </Box>
          ) : contacts.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                No contacts available
              </Typography>
              <Button 
                startIcon={<RefreshIcon />} 
                size="small" 
                onClick={handleRefreshContacts}
                disabled={loadingContacts}
              >
                Refresh
              </Button>
            </Box>
          ) : getFilteredContacts().length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No contacts found matching your search
              </Typography>
            </Box>
          ) : (
            getFilteredContacts().map((contact) => {
              const unreadCount = getUnreadCount(contact._id);
              
              return (
                <ListItem
                  key={contact._id}
                  button
                  selected={selectedContact?._id === contact._id}
                  onClick={() => handleContactSelect(contact)}
                  divider
                >
                  <Avatar 
                    sx={{ 
                      bgcolor: getAvatarColor(contact.role),
                      mr: 2,
                      width: 40,
                      height: 40
                    }}
                  >
                    {getRoleInitial(contact.role)}
                  </Avatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography noWrap sx={{ maxWidth: '70%' }}>
                          {contact.name}
                        </Typography>
                        {unreadCount > 0 && (
                          <Badge badgeContent={unreadCount} color="error" />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="caption" display="block" color="text.secondary" noWrap>
                          {contact.role.charAt(0).toUpperCase() + contact.role.slice(1)}
                          {contact.specialization && ` - ${contact.specialization}`}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              );
            })
          )}
        </List>
      </Paper>

      {/* Messages Area */}
      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedContact ? (
          <>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
              <Avatar 
                sx={{ 
                  bgcolor: getAvatarColor(selectedContact.role),
                  mr: 2,
                  width: 40,
                  height: 40
                }}
              >
                {getRoleInitial(selectedContact.role)}
              </Avatar>
              <Box>
                <Typography variant="h6">{selectedContact.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedContact.role.charAt(0).toUpperCase() + selectedContact.role.slice(1)}
                  {selectedContact.specialization && ` - ${selectedContact.specialization}`}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ flex: 1, overflow: 'auto', p: 2, backgroundColor: '#f5f5f5' }}>
              {isLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <CircularProgress />
                </Box>
              ) : messages && messages.length > 0 ? (
                messages.map((msg) => (
                  <Box
                    key={msg._id}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: msg.sender._id === user._id ? 'flex-end' : 'flex-start',
                      mb: 2,
                    }}
                  >
                    <Paper
                      sx={{
                        p: 2,
                        backgroundColor: msg.sender._id === user._id ? '#e3f2fd' : 'white',
                        borderRadius: 2,
                        maxWidth: '75%',
                        boxShadow: 1,
                      }}
                    >
                      <Typography variant="body1">{msg.content}</Typography>
                    </Paper>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, px: 1 }}>
                      {new Date(msg.createdAt).toLocaleString()}
                      {msg.read && msg.sender._id === user._id && ' • Read'}
                    </Typography>
                    <div ref={messagesEndRef} />
                  </Box>
                ))
              ) : (
                <Box 
                  display="flex" 
                  flexDirection="column" 
                  justifyContent="center" 
                  alignItems="center" 
                  height="100%"
                >
                  <Typography variant="body1" color="text.secondary">
                    No messages yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Send a message to start the conversation
                  </Typography>
                </Box>
              )}
            </Box>
            
            <Box
              component="form"
              onSubmit={handleSendMessage}
              sx={{ p: 2, borderTop: 1, borderColor: 'divider', backgroundColor: 'white' }}
            >
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  autoFocus
                  multiline
                  maxRows={4}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (newMessage.trim()) {
                        handleSendMessage(e);
                      }
                    }
                  }}
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
          </>
        ) : (
          <Box 
            display="flex" 
            flexDirection="column" 
            justifyContent="center" 
            alignItems="center" 
            height="100%"
            p={3}
            textAlign="center"
          >
            <PersonIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Select a contact to start messaging
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {user.role === 'doctor' && "As a doctor, you can message your patients."}
              {user.role === 'patient' && "As a patient, you can message your doctors."}
              {user.role === 'admin' && "As an administrator, you can message anyone in the system."}
              {(user.role === 'nurse' || user.role === 'staff') && "As staff, you can message administrators."}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default Messages;