import { createSlice } from '@reduxjs/toolkit'
import {
  activateAgentInvite,
  createAgent,
  getAgent,
  getAgentInvite,
  getAgentProfile,
  getAgents,
  getAgentSignedDocuments,
  rejectAgentDocument,
  resendAgentInvite,
  reviewAgentDocument,
  saveAgentSignedDocument,
  sendMgaPackageEmail,
  updateAccountActivationStatus,
  updateAgentOnboardingStatus,
  updateAgentProfile,
  updateAgentRegistrationDetails,
} from '../utils/agents.js'

const initialState = {
  getAllAgentsLoading: false,
  getAllAgentsFailed: '',
  allAgentsData: [],

  selectedAgent: null,
  selectedAgentLoading: false,
  selectedAgentFailed: '',

  agentProfile: null,
  agentSignedDocuments: [],
  agentMutationLoading: false,
  agentMutationFailed: '',
  agentInviteData: null,
}

export const agentSlice = createSlice({
  name: 'agent',
  initialState,
  reducers: {
    getAllAgents: (state) => {
      state.getAllAgentsLoading = true
      state.getAllAgentsFailed = ''
    },
    getAllAgentsSuccess: (state, action) => {
      state.getAllAgentsLoading = false
      state.allAgentsData = action.payload
    },
    getAllAgentsFailed: (state, action) => {
      state.getAllAgentsLoading = false
      state.getAllAgentsFailed = action.payload
    },
    getSelectedAgent: (state) => {
      state.selectedAgentLoading = true
      state.selectedAgentFailed = ''
    },
    getSelectedAgentSuccess: (state, action) => {
      state.selectedAgentLoading = false
      state.selectedAgent = action.payload
    },
    getSelectedAgentFailed: (state, action) => {
      state.selectedAgentLoading = false
      state.selectedAgentFailed = action.payload
    },
    Store_Agent_Profile: (state, action) => {
      state.agentProfile = action.payload
    },
    Store_Agent_Signed_Documents: (state, action) => {
      state.agentSignedDocuments = action.payload
    },
    AgentMutation: (state) => {
      state.agentMutationLoading = true
      state.agentMutationFailed = ''
    },
    AgentMutationSuccess: (state) => {
      state.agentMutationLoading = false
    },
    AgentMutationFailed: (state, action) => {
      state.agentMutationLoading = false
      state.agentMutationFailed = action.payload
    },
    Store_Agent_Invite_Data: (state, action) => {
      state.agentInviteData = action.payload
    },
  },
})

export const getAllAgentsAsync = () => async (dispatch) => {
  try {
    dispatch(getAllAgents())
    const response = await getAgents()
    dispatch(getAllAgentsSuccess(response || []))
    return response
  } catch (error) {
    dispatch(getAllAgentsFailed(error?.message || 'Unable to load agents.'))
    return error
  }
}

export const getSelectedAgentAsync = (agentId) => async (dispatch) => {
  try {
    dispatch(getSelectedAgent())
    const response = await getAgent(agentId)
    dispatch(getSelectedAgentSuccess(response))
    return response
  } catch (error) {
    dispatch(getSelectedAgentFailed(error?.message || 'Unable to load agent.'))
    return error
  }
}

const runAgentMutation = async (dispatch, task) => {
  try {
    dispatch(AgentMutation())
    const response = await task()
    dispatch(AgentMutationSuccess())
    return response
  } catch (error) {
    dispatch(AgentMutationFailed(error?.message || 'Unable to save agent changes.'))
    return error
  }
}

export const createAgentAsync = (data) => async (dispatch) => runAgentMutation(dispatch, () => createAgent(data))
export const getAgentInviteAsync = (token) => async (dispatch) => {
  const response = await getAgentInvite(token)
  dispatch(Store_Agent_Invite_Data(response))
  return response
}
export const activateAgentInviteAsync = (token, password) => async (dispatch) =>
  runAgentMutation(dispatch, () => activateAgentInvite(token, password))
export const updateAgentOnboardingStatusAsync = (agentId, status) => async (dispatch) =>
  runAgentMutation(dispatch, () => updateAgentOnboardingStatus(agentId, status))
export const resendAgentInviteAsync = (agentId) => async (dispatch) =>
  runAgentMutation(dispatch, () => resendAgentInvite(agentId))
export const updateAccountActivationStatusAsync = (agentId, status) => async (dispatch) =>
  runAgentMutation(dispatch, () => updateAccountActivationStatus(agentId, status))
export const saveAgentSignedDocumentAsync = (agentId, document) => async (dispatch) =>
  runAgentMutation(dispatch, () => saveAgentSignedDocument(agentId, document))
export const getAgentSignedDocumentsAsync = (agentId) => async (dispatch) => {
  const response = await getAgentSignedDocuments(agentId)
  dispatch(Store_Agent_Signed_Documents(response || []))
  return response
}
export const reviewAgentDocumentAsync = (agentId, payload) => async (dispatch) =>
  runAgentMutation(dispatch, () => reviewAgentDocument(agentId, payload))
export const rejectAgentDocumentAsync = (agentId, payload) => async (dispatch) =>
  runAgentMutation(dispatch, () => rejectAgentDocument(agentId, payload))
export const sendMgaPackageEmailAsync = (agentId, payload) => async (dispatch) =>
  runAgentMutation(dispatch, () => sendMgaPackageEmail(agentId, payload))
export const getAgentProfileAsync = (agentId) => async (dispatch) => {
  const response = await getAgentProfile(agentId)
  dispatch(Store_Agent_Profile(response))
  return response
}
export const updateAgentProfileAsync = (agentId, payload) => async (dispatch) =>
  runAgentMutation(dispatch, () => updateAgentProfile(agentId, payload))
export const updateAgentRegistrationDetailsAsync = (agentId, details) => async (dispatch) =>
  runAgentMutation(dispatch, () => updateAgentRegistrationDetails(agentId, details))

export const {
  getAllAgents,
  getAllAgentsSuccess,
  getAllAgentsFailed,
  getSelectedAgent,
  getSelectedAgentSuccess,
  getSelectedAgentFailed,
  Store_Agent_Profile,
  Store_Agent_Signed_Documents,
  AgentMutation,
  AgentMutationSuccess,
  AgentMutationFailed,
  Store_Agent_Invite_Data,
} = agentSlice.actions

export default agentSlice.reducer

