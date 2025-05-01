import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = '/api/messages';

// Get conversations (list of users with message history)
export const getConversations = createAsyncThunk(
  'messages/getConversations',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.get(`${API_URL}/conversations`, config);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get available contacts to message (based on user role)
export const getAvailableContacts = createAsyncThunk(
  'messages/getAvailableContacts',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.get(`${API_URL}/available-contacts`, config);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get messages between current user and specific user
export const getMessagesWith = createAsyncThunk(
  'messages/getMessagesWith',
  async (userId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.get(`${API_URL}/${userId}`, config);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get unread message count
export const getUnreadCount = createAsyncThunk(
  'messages/getUnreadCount',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.get(`${API_URL}/unread/count`, config);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Send a new message
export const sendMessage = createAsyncThunk(
  'messages/send',
  async (messageData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.post(API_URL, messageData, config);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Mark message as read
export const markAsRead = createAsyncThunk(
  'messages/markAsRead',
  async (messageId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.put(`${API_URL}/${messageId}/read`, {}, config);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const initialState = {
  messages: [],
  conversations: [],
  availableContacts: [],
  unreadCount: 0,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

const messageSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    reset: (state) => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Handle getConversations
      .addCase(getConversations.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getConversations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.conversations = action.payload;
        state.unreadCount = action.payload.reduce((total, conv) => total + conv.unreadCount, 0);
      })
      .addCase(getConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // Handle getMessagesWith
      .addCase(getMessagesWith.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getMessagesWith.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.messages = action.payload;
      })
      .addCase(getMessagesWith.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // Handle getUnreadCount
      .addCase(getUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload.unreadCount;
      })
      
      // Handle sendMessage
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.messages.push(action.payload);
        
        // Update the conversations list if needed
        const otherUserId = action.payload.receiver._id;
        const conversationIndex = state.conversations.findIndex(
          conv => conv.user._id === otherUserId
        );
        
        if (conversationIndex !== -1) {
          // Update existing conversation
          state.conversations[conversationIndex].lastMessage = action.payload;
        } else {
          // Add new conversation
          state.conversations.push({
            user: action.payload.receiver,
            lastMessage: action.payload,
            unreadCount: 0
          });
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // Handle markAsRead
      .addCase(markAsRead.fulfilled, (state, action) => {
        // Update the message in the messages array
        const index = state.messages.findIndex(msg => msg._id === action.payload._id);
        if (index !== -1) {
          state.messages[index] = action.payload;
        }
        
        // Update the conversation unread count
        const senderId = action.payload.sender._id;
        const conversationIndex = state.conversations.findIndex(
          conv => conv.user._id === senderId
        );
        
        if (conversationIndex !== -1 && state.conversations[conversationIndex].unreadCount > 0) {
          state.conversations[conversationIndex].unreadCount--;
          state.unreadCount--;
        }
      })
      
      // Handle getAvailableContacts
      .addCase(getAvailableContacts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAvailableContacts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.availableContacts = action.payload;
      })
      .addCase(getAvailableContacts.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = messageSlice.actions;
export default messageSlice.reducer;