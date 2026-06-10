import { createSelector, createSlice } from '@reduxjs/toolkit'

export const ONBOARDING_STEPS = [
  'registration',
  'agreements',
  'mgaSubmission',
  'adminReview',
  'profileSetup',
  'training',
]

const initialState = {
  activeStep: 'registration',
  mode: 'transfer',
  form: {
    name: '',
    email: '',
    phone: '',
    agentId: '',
    licenceType: 'Existing licence transfer',
    requireSponsorship: false,
    haveApexa: false,
    apexaId: '',
    creditScore: '',
    accessCode: '',
    status: 'Submitted',
    comment: '',
    fullSin: '',
    mga: '',
    insuranceCompany: '',
    licenceExpiryDate: '',
    eoPolicyNumber: '',
    eoPolicyCompany: '',
    eoPolicyExpiryDate: '',
    referralSource: '',
    notes: '',
    commissionOverride: '',
    segFundsOverride: '',
  },
  docs: {
    governmentId: null,
    transferDocument: null,
    eandODocument: null,
    creditReportDocument: null,
  },
  steps: {
    registration: {
      status: 'in_progress',
      completed: 0,
      total: 0,
      percentage: 0,
    },
    agreements: {
      status: 'locked',
      pdfGenerated: false,
      esignTriggered: false,
    },
    mgaSubmission: {
      status: 'locked',
      packageGenerated: false,
      emailTriggered: false,
    },
    adminReview: {
      status: 'locked',
      approved: false,
    },
    profileSetup: {
      status: 'locked',
      percentage: 0,
    },
    training: {
      status: 'locked',
      percentage: 0,
    },
  },
}

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    updateOnboardingField(state, action) {
      const { key, value } = action.payload
      state.form[key] = value
    },
    updateOnboardingDoc(state, action) {
      const { key, file } = action.payload
      state.docs[key] = file
    },
    setOnboardingMode(state, action) {
      const mode = action.payload
      state.mode = mode
      state.form.licenceType =
        mode === 'new' ? 'New licence application' : 'Existing licence transfer'
      state.form.requireSponsorship = mode === 'new' ? true : state.form.requireSponsorship

      if (mode === 'new') {
        state.docs.transferDocument = null
        state.docs.eandODocument = null
      }
    },
    toggleApexa(state, action) {
      state.form.haveApexa = action.payload
      if (!action.payload) state.form.apexaId = ''
    },
    setRegistrationProgress(state, action) {
      state.steps.registration = {
        ...state.steps.registration,
        ...action.payload,
      }
    },
    setActiveStep(state, action) {
      state.activeStep = action.payload
    },
    setStepStatus(state, action) {
      const { step, status, meta = {} } = action.payload
      state.steps[step] = {
        ...state.steps[step],
        status,
        ...meta,
      }
    },
    triggerAgreements(state) {
      state.steps.agreements = {
        ...state.steps.agreements,
        status: 'in_progress',
        pdfGenerated: true,
        esignTriggered: true,
      }
      state.activeStep = 'agreements'
    },
  },
})

export const {
  updateOnboardingField,
  updateOnboardingDoc,
  setOnboardingMode,
  toggleApexa,
  setRegistrationProgress,
  setActiveStep,
  setStepStatus,
  triggerAgreements,
} = onboardingSlice.actions

export const selectOnboarding = (state) => state.onboarding
export const selectRegistrationProgress = createSelector(
  [selectOnboarding],
  (onboarding) => onboarding.steps.registration,
)

export default onboardingSlice.reducer
