import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as personsApi from '../utils/persons.js'

// ============ ASYNC THUNKS ============

export const getAllPersonsAsync = createAsyncThunk(
  'person/getAllPersons',
  async (params, { rejectWithValue }) => {
    try {
      return await personsApi.getPersons(params)
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const getPersonAsync = createAsyncThunk(
  'person/getPerson',
  async (id, { rejectWithValue }) => {
    try {
      return await personsApi.getPerson(id)
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const createPersonAsync = createAsyncThunk(
  'person/createPerson',
  async (data, { rejectWithValue }) => {
    try {
      return await personsApi.createPerson(data)
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const updatePersonAsync = createAsyncThunk(
  'person/updatePerson',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await personsApi.updatePerson(id, data)
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const updatePersonStatusAsync = createAsyncThunk(
  'person/updateStatus',
  async ({ id, status, notes }, { rejectWithValue }) => {
    try {
      return await personsApi.updatePersonStatus(id, status, notes)
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const getMyPersonsAsync = createAsyncThunk(
  'person/getMyPersons',
  async (phase, { rejectWithValue }) => {
    try {
      return await personsApi.getMyPersons(phase)
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const getFollowUpsAsync = createAsyncThunk(
  'person/getFollowUps',
  async (personId, { rejectWithValue }) => {
    try {
      return await personsApi.getFollowUps(personId)
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const getTodayFollowUpsAsync = createAsyncThunk(
  'person/getTodayFollowUps',
  async (_, { rejectWithValue }) => {
    try {
      return await personsApi.getTodayFollowUps()
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const getTomorrowFollowUpsAsync = createAsyncThunk(
  'person/getTomorrowFollowUps',
  async (_, { rejectWithValue }) => {
    try {
      return await personsApi.getTomorrowFollowUps()
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const getOverdueFollowUpsAsync = createAsyncThunk(
  'person/getOverdueFollowUps',
  async (_, { rejectWithValue }) => {
    try {
      return await personsApi.getOverdueFollowUps()
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const getActivityLogsAsync = createAsyncThunk(
  'person/getActivityLogs',
  async (personId, { rejectWithValue }) => {
    try {
      return await personsApi.getActivityLogs(personId)
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const getStatusHistoryAsync = createAsyncThunk(
  'person/getStatusHistory',
  async (personId, { rejectWithValue }) => {
    try {
      return await personsApi.getStatusHistory(personId)
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const getNeedAnalysisAsync = createAsyncThunk(
  'person/getNeedAnalysis',
  async (personId, { rejectWithValue }) => {
    try {
      return await personsApi.getNeedAnalysis(personId)
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const saveNeedAnalysisAsync = createAsyncThunk(
  'person/saveNeedAnalysis',
  async ({ personId, data }, { rejectWithValue }) => {
    try {
      return await personsApi.saveNeedAnalysis(personId, data)
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const getQuotesAsync = createAsyncThunk(
  'person/getQuotes',
  async (personId, { rejectWithValue }) => {
    try {
      return await personsApi.getQuotes(personId)
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const getOpportunitiesAsync = createAsyncThunk(
  'person/getOpportunities',
  async (personId, { rejectWithValue }) => {
    try {
      return await personsApi.getOpportunities(personId)
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const getFamilyMembersAsync = createAsyncThunk(
  'person/getFamilyMembers',
  async (personId, { rejectWithValue }) => {
    try {
      return await personsApi.getFamilyMembers(personId)
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const getPoliciesAsync = createAsyncThunk(
  'person/getPolicies',
  async (personId, { rejectWithValue }) => {
    try {
      return await personsApi.getPolicies(personId)
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

// ============ SLICE ============

const initialState = {
  // List
  persons: [],
  personsTotal: 0,
  personsPage: 1,
  personsLimit: 20,
  getAllPersonsLoading: false,
  getAllPersonsError: '',

  // Selected person
  selectedPerson: null,
  getPersonLoading: false,
  getPersonError: '',

  // Sub-data
  familyMembers: [],
  policies: [],
  quotes: [],
  opportunities: [],
  followUps: [],
  todayFollowUps: [],
  tomorrowFollowUps: [],
  overdueFollowUps: [],
  activityLogs: [],
  statusHistory: [],
  needAnalysis: [],

  // Loading states
  saving: false,
  saveMsg: null,
}

const personSlice = createSlice({
  name: 'person',
  initialState,
  reducers: {
    clearSelectedPerson: (state) => {
      state.selectedPerson = null
      state.familyMembers = []
      state.policies = []
      state.quotes = []
      state.opportunities = []
      state.followUps = []
      state.activityLogs = []
      state.statusHistory = []
      state.needAnalysis = []
    },
    clearSaveMsg: (state) => {
      state.saveMsg = null
    },
  },
  extraReducers: (builder) => {
    // getAllPersons
    builder
      .addCase(getAllPersonsAsync.pending, (state) => {
        state.getAllPersonsLoading = true
        state.getAllPersonsError = ''
      })
      .addCase(getAllPersonsAsync.fulfilled, (state, action) => {
        state.getAllPersonsLoading = false
        state.persons = action.payload.data || []
        state.personsTotal = action.payload.total || 0
        state.personsPage = action.payload.page || 1
        state.personsLimit = action.payload.limit || 20
      })
      .addCase(getAllPersonsAsync.rejected, (state, action) => {
        state.getAllPersonsLoading = false
        state.getAllPersonsError = action.payload
      })

    // getPerson
    builder
      .addCase(getPersonAsync.pending, (state) => {
        state.getPersonLoading = true
        state.getPersonError = ''
      })
      .addCase(getPersonAsync.fulfilled, (state, action) => {
        state.getPersonLoading = false
        state.selectedPerson = action.payload
        state.familyMembers = action.payload.familyMembers || []
        state.policies = action.payload.policies || []
        state.quotes = action.payload.quotes || []
        state.opportunities = action.payload.opportunities || []
        state.followUps = action.payload.followUps || []
        state.activityLogs = action.payload.activityLogs || []
        state.statusHistory = action.payload.statusHistory || []
        state.needAnalysis = action.payload.needAnalyses || []
      })
      .addCase(getPersonAsync.rejected, (state, action) => {
        state.getPersonLoading = false
        state.getPersonError = action.payload
      })

    // createPerson
    builder
      .addCase(createPersonAsync.pending, (state) => {
        state.saving = true
      })
      .addCase(createPersonAsync.fulfilled, (state, action) => {
        state.saving = false
        state.saveMsg = 'created'
      })
      .addCase(createPersonAsync.rejected, (state) => {
        state.saving = false
        state.saveMsg = 'error'
      })

    // updatePerson
    builder
      .addCase(updatePersonAsync.pending, (state) => {
        state.saving = true
      })
      .addCase(updatePersonAsync.fulfilled, (state, action) => {
        state.saving = false
        state.selectedPerson = action.payload
        state.saveMsg = 'saved'
      })
      .addCase(updatePersonAsync.rejected, (state) => {
        state.saving = false
        state.saveMsg = 'error'
      })

    // updatePersonStatus
    builder
      .addCase(updatePersonStatusAsync.fulfilled, (state, action) => {
        state.selectedPerson = action.payload
      })

    // getMyPersons
    builder
      .addCase(getMyPersonsAsync.fulfilled, (state, action) => {
        state.persons = action.payload || []
        state.personsTotal = action.payload?.length || 0
      })

    // followUps
    builder
      .addCase(getFollowUpsAsync.fulfilled, (state, action) => {
        state.followUps = action.payload || []
      })
      .addCase(getTodayFollowUpsAsync.fulfilled, (state, action) => {
        state.todayFollowUps = action.payload || []
      })
      .addCase(getTomorrowFollowUpsAsync.fulfilled, (state, action) => {
        state.tomorrowFollowUps = action.payload || []
      })
      .addCase(getOverdueFollowUpsAsync.fulfilled, (state, action) => {
        state.overdueFollowUps = action.payload || []
      })

    // activityLogs
    builder
      .addCase(getActivityLogsAsync.fulfilled, (state, action) => {
        state.activityLogs = action.payload || []
      })

    // statusHistory
    builder
      .addCase(getStatusHistoryAsync.fulfilled, (state, action) => {
        state.statusHistory = action.payload || []
      })

    // needAnalysis
    builder
      .addCase(getNeedAnalysisAsync.fulfilled, (state, action) => {
        state.needAnalysis = action.payload || []
      })
      .addCase(saveNeedAnalysisAsync.fulfilled, (state) => {
        state.saveMsg = 'saved'
      })

    // quotes
    builder
      .addCase(getQuotesAsync.fulfilled, (state, action) => {
        state.quotes = action.payload || []
      })

    // opportunities
    builder
      .addCase(getOpportunitiesAsync.fulfilled, (state, action) => {
        state.opportunities = action.payload || []
      })

    // familyMembers
    builder
      .addCase(getFamilyMembersAsync.fulfilled, (state, action) => {
        state.familyMembers = action.payload || []
      })

    // policies
    builder
      .addCase(getPoliciesAsync.fulfilled, (state, action) => {
        state.policies = action.payload || []
      })
  },
})

export const { clearSelectedPerson, clearSaveMsg } = personSlice.actions
export default personSlice.reducer
