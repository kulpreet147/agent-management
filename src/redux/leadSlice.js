import { createSlice } from '@reduxjs/toolkit'
import {
  addFollowUp,
  addNote,
  getActivityLog,
  getFollowUps,
  getLead,
  getLeads,
  getNeedAnalysis,
  getStatusHistory,
  getUpcomingFollowUps,
  listQuotes,
  runQuote,
  saveNeedAnalysis,
} from '../utils/leads.js'

const initialState = {
  getAllLeadsLoading: false,
  getAllLeadsFailed: '',
  allLeadsData: [],
  leadPaginationLength: 0,
  leadStartedRecords: 1,
  leadToRecords: 0,
  leadTotalPages: 0,

  selectedLead: null,
  getSelectedLeadLoading: false,
  getSelectedLeadFailed: '',

  getLeadTimelineLoading: false,
  leadTimelineData: [],
  getLeadTimelineFailed: '',
  leadTimelineLength: 0,
  leadTimelineStartedRecords: 1,
  leadTimelineToRecords: 0,
  leadTimelineTotalPage: 0,

  askLeadQuestionLoading: false,
  askLeadQuestionFailed: '',

  getUpcomingFollowUpsLoading: false,
  upcomingFollowUpsData: [],
  getUpcomingFollowUpsFailed: '',
  upcomingFollowUpsLength: 0,
  upcomingFollowUpsStartedRecords: 1,
  upcomingFollowUpsToRecords: 0,
  upcomingFollowUpsTotalPage: 0,

  leadActivityLog: [],
  leadFollowUps: [],
  leadStatusHistory: [],
  leadNeedAnalysis: null,
  leadQuotes: [],
}

const buildPagination = (items, totalCount, currentPage, perPage) => {
  const safePage = Number(currentPage || 1)
  const safePerPage = Number(perPage || 10)
  const length = Number(totalCount || 0)
  const startedRecords = length === 0 ? 0 : (safePage - 1) * safePerPage + 1
  const toRecords = Math.min(safePage * safePerPage, length)
  const totalPages = Math.max(1, Math.ceil(length / safePerPage))

  return [items, length, startedRecords, toRecords, totalPages]
}

export const leadSlice = createSlice({
  name: 'lead',
  initialState,
  reducers: {
    getAllLeads: (state) => {
      state.getAllLeadsLoading = true
      state.getAllLeadsFailed = ''
    },
    getAllLeadsSuccess: (state, action) => {
      state.getAllLeadsLoading = false
      state.allLeadsData = action.payload[0]
      state.leadPaginationLength = action.payload[1]
      state.leadStartedRecords = action.payload[2]
      state.leadToRecords = action.payload[3]
      state.leadTotalPages = action.payload[4]
    },
    getAllLeadsFailed: (state, action) => {
      state.getAllLeadsLoading = false
      state.getAllLeadsFailed = action.payload
    },

    Store_Selected_Lead: (state, action) => {
      state.selectedLead = action.payload
    },

    getSelectedLead: (state) => {
      state.getSelectedLeadLoading = true
      state.getSelectedLeadFailed = ''
    },
    getSelectedLeadSuccess: (state, action) => {
      state.getSelectedLeadLoading = false
      state.selectedLead = action.payload
    },
    getSelectedLeadFailed: (state, action) => {
      state.getSelectedLeadLoading = false
      state.getSelectedLeadFailed = action.payload
    },

    getLeadTimeline: (state) => {
      state.getLeadTimelineLoading = true
      state.getLeadTimelineFailed = ''
    },
    getLeadTimelineSuccess: (state, action) => {
      state.getLeadTimelineLoading = false
      state.leadTimelineData = action.payload[0]
      state.leadTimelineLength = action.payload[1]
      state.leadTimelineStartedRecords = action.payload[2]
      state.leadTimelineToRecords = action.payload[3]
      state.leadTimelineTotalPage = action.payload[4]
    },
    getLeadTimelineFailed: (state, action) => {
      state.getLeadTimelineLoading = false
      state.getLeadTimelineFailed = action.payload
    },

    AskLeadQuestion: (state) => {
      state.askLeadQuestionLoading = true
      state.askLeadQuestionFailed = ''
    },
    AskLeadQuestionSuccess: (state) => {
      state.askLeadQuestionLoading = false
    },
    AskLeadQuestionFailed: (state, action) => {
      state.askLeadQuestionLoading = false
      state.askLeadQuestionFailed = action.payload
    },

    getAllUpcomingFollowUps: (state) => {
      state.getUpcomingFollowUpsLoading = true
      state.getUpcomingFollowUpsFailed = ''
    },
    getAllUpcomingFollowUpsSuccess: (state, action) => {
      state.getUpcomingFollowUpsLoading = false
      state.upcomingFollowUpsData = action.payload[0]
      state.upcomingFollowUpsLength = action.payload[1]
      state.upcomingFollowUpsStartedRecords = action.payload[2]
      state.upcomingFollowUpsToRecords = action.payload[3]
      state.upcomingFollowUpsTotalPage = action.payload[4]
    },
    getAllUpcomingFollowUpsFailed: (state, action) => {
      state.getUpcomingFollowUpsLoading = false
      state.getUpcomingFollowUpsFailed = action.payload
    },

    Store_Lead_Activity_Log: (state, action) => {
      state.leadActivityLog = action.payload
    },
    Store_Lead_Follow_Ups: (state, action) => {
      state.leadFollowUps = action.payload
    },
    Store_Lead_Status_History: (state, action) => {
      state.leadStatusHistory = action.payload
    },
    Store_Lead_Need_Analysis: (state, action) => {
      state.leadNeedAnalysis = action.payload
    },
    Store_Lead_Quotes: (state, action) => {
      state.leadQuotes = action.payload
    },
  },
})

export const getAllLeadsAsync = (data) => async (dispatch) => {
  try {
    dispatch(getAllLeads())

    const response = await getLeads({
      page: data?.page,
      limit: data?.perPage,
      status: data?.status,
      search: data?.search,
      agentId: data?.agentId,
      leadPriority: data?.leadPriority,
      leadSource: data?.leadSource,
    })

    const rows = Array.isArray(response) ? response : response?.leads || []
    const total = Array.isArray(response) ? response.length : response?.total || rows.length

    dispatch(getAllLeadsSuccess(buildPagination(rows, total, data?.page || 1, data?.perPage || 10)))
    return response
  } catch (error) {
    dispatch(getAllLeadsFailed(error?.message || 'Unable to load leads.'))
    return error
  }
}

export const getSelectedLeadAsync = (leadId) => async (dispatch) => {
  try {
    dispatch(getSelectedLead())
    const response = await getLead(leadId)
    dispatch(getSelectedLeadSuccess(response))
    dispatch(Store_Selected_Lead(response))
    return response
  } catch (error) {
    dispatch(getSelectedLeadFailed(error?.message || 'Unable to load lead.'))
    return error
  }
}

export const getLeadTimelineAsync = (leadId, take = 10, currentPage = 1) => async (dispatch) => {
  try {
    dispatch(getLeadTimeline())

    const [activityResponse, followUpsResponse, statusHistoryResponse] = await Promise.all([
      getActivityLog(leadId, currentPage, take).catch(() => []),
      getFollowUps(leadId).catch(() => []),
      getStatusHistory(leadId).catch(() => []),
    ])

    const activityRows = Array.isArray(activityResponse)
      ? activityResponse
      : activityResponse?.data || activityResponse?.activities || []
    const followUpsRows = Array.isArray(followUpsResponse) ? followUpsResponse : []
    const statusHistoryRows = Array.isArray(statusHistoryResponse) ? statusHistoryResponse : []
    const timelineRows = [...activityRows, ...followUpsRows]

    dispatch(Store_Lead_Activity_Log(activityRows))
    dispatch(Store_Lead_Follow_Ups(followUpsRows))
    dispatch(Store_Lead_Status_History(statusHistoryRows))
    dispatch(getLeadTimelineSuccess(buildPagination(timelineRows, timelineRows.length, currentPage, take)))
    return timelineRows
  } catch (error) {
    dispatch(getLeadTimelineFailed(error?.message || 'Unable to load lead timeline.'))
    return error
  }
}

export const AskLeadQuestionAsync = (data) => async (dispatch) => {
  try {
    dispatch(AskLeadQuestion())

    const leadId = data?.leadId || data?.projectId
    const response =
      data?.noteType || data?.content
        ? await addNote(leadId, data?.content || '', data?.noteType || 'general')
        : await addFollowUp(leadId, data)

    dispatch(AskLeadQuestionSuccess())
    return response
  } catch (error) {
    dispatch(AskLeadQuestionFailed(error?.message || 'Unable to save lead activity.'))
    return error
  }
}

export const getAllUpcomingFollowUpsAsync = (data) => async (dispatch) => {
  try {
    dispatch(getAllUpcomingFollowUps())
    const response = await getUpcomingFollowUps()
    const rows = Array.isArray(response) ? response : []
    dispatch(getAllUpcomingFollowUpsSuccess(buildPagination(rows, rows.length, data?.page || 1, data?.perPage || 10)))
    return rows
  } catch (error) {
    dispatch(getAllUpcomingFollowUpsFailed(error?.message || 'Unable to load upcoming follow-ups.'))
    return error
  }
}

export const getLeadNeedAnalysisAsync = (leadId) => async (dispatch) => {
  const response = await getNeedAnalysis(leadId)
  dispatch(Store_Lead_Need_Analysis(response))
  return response
}

export const saveLeadNeedAnalysisAsync = (leadId, data) => async (dispatch) => {
  const response = await saveNeedAnalysis(leadId, data)
  dispatch(Store_Lead_Need_Analysis(response))
  return response
}

export const getLeadQuotesAsync = (leadId, params) => async (dispatch) => {
  const response = params ? await runQuote(leadId, params) : await listQuotes(leadId)
  const rows = Array.isArray(response) ? response : response?.quotes || []
  dispatch(Store_Lead_Quotes(rows))
  return response
}

export const {
  getAllLeads,
  getAllLeadsSuccess,
  getAllLeadsFailed,
  Store_Selected_Lead,
  getSelectedLead,
  getSelectedLeadSuccess,
  getSelectedLeadFailed,
  getLeadTimeline,
  getLeadTimelineSuccess,
  getLeadTimelineFailed,
  AskLeadQuestion,
  AskLeadQuestionSuccess,
  AskLeadQuestionFailed,
  getAllUpcomingFollowUps,
  getAllUpcomingFollowUpsSuccess,
  getAllUpcomingFollowUpsFailed,
  Store_Lead_Activity_Log,
  Store_Lead_Follow_Ups,
  Store_Lead_Status_History,
  Store_Lead_Need_Analysis,
  Store_Lead_Quotes,
} = leadSlice.actions

export default leadSlice.reducer

