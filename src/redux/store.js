import { configureStore } from '@reduxjs/toolkit'
import auth from './authSlice.js'
import lead from './leadSlice.js'
import agent from './agentSlice.js'
import account from './accountSlice.js'
import realtime from './realtimeSlice.js'
import person from './personSlice.js'
import onboarding from './onboardingSlice.js'

export const store = configureStore({
  reducer: {
    auth,
    lead,
    agent,
    account,
    realtime,
    person,
    onboarding,
  },
})
