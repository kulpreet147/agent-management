import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead, deleteNotification } from '../utils/notifications.js'

export const fetchNotifications = createAsyncThunk('notifications/fetch', async (params, { rejectWithValue }) => {
  try {
    const data = await getNotifications(params)
    return { notifications: Array.isArray(data) ? data : data?.notifications || [], total: data?.total || 0 }
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const fetchUnreadCount = createAsyncThunk('notifications/unreadCount', async (_, { rejectWithValue }) => {
  try {
    const data = await getUnreadCount()
    return typeof data === 'object' ? data.count : (data || 0)
  } catch {
    return rejectWithValue(0)
  }
})

export const markRead = createAsyncThunk('notifications/markRead', async (id, { rejectWithValue }) => {
  try {
    await markNotificationRead(id)
    return id
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const markAllRead = createAsyncThunk('notifications/markAllRead', async (_, { rejectWithValue }) => {
  try {
    await markAllNotificationsRead()
    return true
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const removeNotification = createAsyncThunk('notifications/remove', async (id, { rejectWithValue }) => {
  try {
    await deleteNotification(id)
    return id
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

const initialState = {
  items: [],
  total: 0,
  unreadCount: 0,
  loading: false,
  error: null,
}

export const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addRealtimeNotification(state, action) {
      const exists = state.items.some(n => n.id === action.payload.id)
      if (!exists) {
        state.items.unshift(action.payload)
        state.total += 1
        state.unreadCount += 1
      }
    },
    clearNotifications(state) {
      state.items = []
      state.total = 0
      state.unreadCount = 0
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.items = action.payload.notifications
        state.total = action.payload.total
        state.loading = false
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => { state.unreadCount = action.payload })
      .addCase(markRead.fulfilled, (state, action) => {
        const n = state.items.find(item => item.id === action.payload)
        if (n && !n.readAt) {
          n.readAt = new Date().toISOString()
          state.unreadCount = Math.max(0, state.unreadCount - 1)
        }
      })
      .addCase(markAllRead.fulfilled, (state) => {
        state.items.forEach(n => { if (!n.readAt) n.readAt = new Date().toISOString() })
        state.unreadCount = 0
      })
      .addCase(removeNotification.fulfilled, (state, action) => {
        state.items = state.items.filter(n => n.id !== action.payload)
        state.total = Math.max(0, state.total - 1)
      })
  },
})

export const { addRealtimeNotification, clearNotifications } = notificationSlice.actions
export default notificationSlice.reducer
