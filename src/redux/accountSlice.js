import { createSlice } from '@reduxjs/toolkit'
import {
  activateAccountInvite,
  createAccountInvite,
  getAccountInvite,
  listAccounts,
  resendAccountInvite,
  setAccountBlocked,
} from '../utils/admins.js'

const initialState = {
  getAllAccountsLoading: false,
  getAllAccountsFailed: '',
  allAccountsData: [],
  selectedInviteData: null,
  accountMutationLoading: false,
  accountMutationFailed: '',
}

export const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    getAllAccounts: (state) => {
      state.getAllAccountsLoading = true
      state.getAllAccountsFailed = ''
    },
    getAllAccountsSuccess: (state, action) => {
      state.getAllAccountsLoading = false
      state.allAccountsData = action.payload
    },
    getAllAccountsFailed: (state, action) => {
      state.getAllAccountsLoading = false
      state.getAllAccountsFailed = action.payload
    },
    Store_Account_Invite_Data: (state, action) => {
      state.selectedInviteData = action.payload
    },
    AccountMutation: (state) => {
      state.accountMutationLoading = true
      state.accountMutationFailed = ''
    },
    AccountMutationSuccess: (state) => {
      state.accountMutationLoading = false
    },
    AccountMutationFailed: (state, action) => {
      state.accountMutationLoading = false
      state.accountMutationFailed = action.payload
    },
  },
})

const runAccountMutation = async (dispatch, task) => {
  try {
    dispatch(AccountMutation())
    const response = await task()
    dispatch(AccountMutationSuccess())
    return response
  } catch (error) {
    dispatch(AccountMutationFailed(error?.message || 'Unable to save account changes.'))
    return error
  }
}

export const getAllAccountsAsync = (accountType = 'admin') => async (dispatch) => {
  try {
    dispatch(getAllAccounts())
    const response = await listAccounts(accountType)
    dispatch(getAllAccountsSuccess(response || []))
    return response
  } catch (error) {
    dispatch(getAllAccountsFailed(error?.message || 'Unable to load accounts.'))
    return error
  }
}

export const createAccountInviteAsync = (accountType, payload) => async (dispatch) =>
  runAccountMutation(dispatch, () => createAccountInvite(accountType, payload))
export const resendAccountInviteAsync = (accountType, accountId) => async (dispatch) =>
  runAccountMutation(dispatch, () => resendAccountInvite(accountType, accountId))
export const getAccountInviteAsync = (accountType, token) => async (dispatch) => {
  const response = await getAccountInvite(accountType, token)
  dispatch(Store_Account_Invite_Data(response))
  return response
}
export const activateAccountInviteAsync = (accountType, token, password) => async (dispatch) =>
  runAccountMutation(dispatch, () => activateAccountInvite(accountType, token, password))
export const setAccountBlockedAsync = (accountType, accountId, isBlocked) => async (dispatch) =>
  runAccountMutation(dispatch, () => setAccountBlocked(accountType, accountId, isBlocked))

export const {
  getAllAccounts,
  getAllAccountsSuccess,
  getAllAccountsFailed,
  Store_Account_Invite_Data,
  AccountMutation,
  AccountMutationSuccess,
  AccountMutationFailed,
} = accountSlice.actions

export default accountSlice.reducer
