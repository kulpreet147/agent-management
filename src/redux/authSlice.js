import { createSlice } from '@reduxjs/toolkit'
import { auth } from '../utils/auth.js'
import { activateAccountInvite } from '../utils/admins.js'
import { activateAgentInvite } from '../utils/agents.js'

const session = auth.get()

const initialState = {
  session,
  isAuthenticated: Boolean(session),
  loginLoading: false,
  loginError: '',
  recoveryLoading: false,
  recoveryMessage: '',
  recoveryError: '',
  validateResetTokenLoading: false,
  validateResetTokenError: '',
  resetPasswordLoading: false,
  resetPasswordError: '',
  accountActivationLoading: false,
  accountActivationError: '',
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    Login: (state) => {
      state.loginLoading = true
      state.loginError = ''
    },
    LoginSuccess: (state, action) => {
      state.loginLoading = false
      state.session = action.payload
      state.isAuthenticated = true
    },
    LoginFailed: (state, action) => {
      state.loginLoading = false
      state.loginError = action.payload
    },
    PasswordRecovery: (state) => {
      state.recoveryLoading = true
      state.recoveryError = ''
      state.recoveryMessage = ''
    },
    PasswordRecoverySuccess: (state, action) => {
      state.recoveryLoading = false
      state.recoveryMessage = action.payload
    },
    PasswordRecoveryFailed: (state, action) => {
      state.recoveryLoading = false
      state.recoveryError = action.payload
    },
    ValidateResetToken: (state) => {
      state.validateResetTokenLoading = true
      state.validateResetTokenError = ''
    },
    ValidateResetTokenSuccess: (state) => {
      state.validateResetTokenLoading = false
    },
    ValidateResetTokenFailed: (state, action) => {
      state.validateResetTokenLoading = false
      state.validateResetTokenError = action.payload
    },
    ResetPassword: (state) => {
      state.resetPasswordLoading = true
      state.resetPasswordError = ''
    },
    ResetPasswordSuccess: (state) => {
      state.resetPasswordLoading = false
    },
    ResetPasswordFailed: (state, action) => {
      state.resetPasswordLoading = false
      state.resetPasswordError = action.payload
    },
    ActivateAccount: (state) => {
      state.accountActivationLoading = true
      state.accountActivationError = ''
    },
    ActivateAccountSuccess: (state) => {
      state.accountActivationLoading = false
    },
    ActivateAccountFailed: (state, action) => {
      state.accountActivationLoading = false
      state.accountActivationError = action.payload
    },
    Logout: (state) => {
      auth.logout()
      state.session = null
      state.isAuthenticated = false
      state.loginLoading = false
      state.loginError = ''
    },
    ClearAuthMessage: (state) => {
      state.loginError = ''
      state.recoveryError = ''
      state.recoveryMessage = ''
      state.validateResetTokenError = ''
      state.resetPasswordError = ''
      state.accountActivationError = ''
    },
  },
})

export const LoginAsync = (data) => async (dispatch) => {
  try {
    dispatch(Login())
    const response = await auth.login(data)
    dispatch(LoginSuccess(response))
    return response
  } catch (error) {
    dispatch(LoginFailed(error?.message || 'Login failed.'))
    return error
  }
}

export const PasswordRecoveryAsync = (data) => async (dispatch) => {
  try {
    dispatch(PasswordRecovery())
    const response = await auth.requestPasswordReset(data)
    dispatch(PasswordRecoverySuccess(response?.message || 'Recovery link sent.'))
    return response
  } catch (error) {
    dispatch(PasswordRecoveryFailed(error?.message || 'Unable to send recovery link.'))
    return error
  }
}

export const ValidatePasswordResetTokenAsync = (token) => async (dispatch) => {
  try {
    dispatch(ValidateResetToken())
    const response = await auth.validatePasswordResetToken(token)
    dispatch(ValidateResetTokenSuccess())
    return response
  } catch (error) {
    dispatch(ValidateResetTokenFailed(error?.message || 'Invalid reset token.'))
    return error
  }
}

export const ResetPasswordAsync = (data) => async (dispatch) => {
  try {
    dispatch(ResetPassword())
    const response = await auth.resetPassword(data)
    dispatch(ResetPasswordSuccess())
    return response
  } catch (error) {
    dispatch(ResetPasswordFailed(error?.message || 'Unable to reset password.'))
    return error
  }
}

export const ActivateAdminAccountAsync = (token, password) => async (dispatch) => {
  try {
    dispatch(ActivateAccount())
    const response = await activateAccountInvite('admin', token, password)
    dispatch(ActivateAccountSuccess())
    return response
  } catch (error) {
    dispatch(ActivateAccountFailed(error?.message || 'Unable to activate admin account.'))
    return error
  }
}

export const ActivateAgentAccountAsync = (token, password) => async (dispatch) => {
  try {
    dispatch(ActivateAccount())
    const response = await activateAgentInvite(token, password)
    dispatch(ActivateAccountSuccess())
    return response
  } catch (error) {
    dispatch(ActivateAccountFailed(error?.message || 'Unable to activate agent account.'))
    return error
  }
}

export const {
  Login,
  LoginSuccess,
  LoginFailed,
  PasswordRecovery,
  PasswordRecoverySuccess,
  PasswordRecoveryFailed,
  ValidateResetToken,
  ValidateResetTokenSuccess,
  ValidateResetTokenFailed,
  ResetPassword,
  ResetPasswordSuccess,
  ResetPasswordFailed,
  ActivateAccount,
  ActivateAccountSuccess,
  ActivateAccountFailed,
  Logout,
  ClearAuthMessage,
} = authSlice.actions

export default authSlice.reducer
