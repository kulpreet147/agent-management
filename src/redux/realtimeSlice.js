import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  activeAlert: null,
}

export const realtimeSlice = createSlice({
  name: 'realtime',
  initialState,
  reducers: {
    ShowRealtimeAlert: (state, action) => {
      state.activeAlert = {
        id: Date.now(),
        variant: 'info',
        actionType: null,
        ...action.payload,
      }
    },
    ClearRealtimeAlert: (state) => {
      state.activeAlert = null
    },
  },
})

export const { ShowRealtimeAlert, ClearRealtimeAlert } = realtimeSlice.actions

export default realtimeSlice.reducer

