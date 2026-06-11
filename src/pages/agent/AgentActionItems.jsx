import { useState, useEffect } from 'react'
import {
  Phone,
  Mail,
  FileText,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  ChevronDown,
  TrendingUp,
  CheckCircle,
  Users,
  ClipboardList,
  StickyNote,
  RefreshCw,
  Bot,
  Cake,
  MapPin,
} from 'lucide-react'
import { auth } from '../../utils/auth.js'
import { notify } from '../../utils/notify.js'
import AgentSidebar from '../../components/AgentSidebar.jsx'
import CommonHeader from '../../components/CommonHeader.jsx'
import {
  getTodayFollowUps,
  getTomorrowFollowUps,
  getOverdueFollowUps,
  getUpcomingFollowUps,
  updateFollowUp,
} from '../../utils/leads.js'

const taskTypeIcons = {
  call: Phone,
  email: Mail,
  meeting: Users,
  task: ClipboardList,
  follow_up: Clock,
  beneficiary_change: StickyNote,
  address_update: MapPin,
  renewal: RefreshCw,
  birthday: Cake,
  automated: Bot,
}

const priorityBorder = {
  high: 'border-l-4 border-red-500',
  medium: 'border-l-4 border-amber-500',
  low: 'border-l-4 border-brand-700',
}

const priorityIconBg = {
  high: 'bg-red-50 text-red-600',
  medium: 'bg-yellow-50 text-amber-700',
  low: 'bg-brand-50 text-brand-700',
}

const dates = ['Yesterday', 'Today', 'Tomorrow', 'This Week']
const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now - date) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export default function AgentActionItems() {
  const session = auth.get()
  const agentName = session?.name || 'Agent'
  const initials = agentName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const today = new Date()
  const [activeDate, setActiveDate] = useState('Today')
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [selectedDay, setSelectedDay] = useState(today.getDate())
  const [headerSearch, setHeaderSearch] = useState('')

  const [todayTasks, setTodayTasks] = useState([])
  const [tomorrowTasks, setTomorrowTasks] = useState([])
  const [overdueTasks, setOverdueTasks] = useState([])
  const [upcomingTasks, setUpcomingTasks] = useState([])
  const [completedTasks, setCompletedTasks] = useState([])
  const [overdueOpen, setOverdueOpen] = useState(false)
  const [completedOpen, setCompletedOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const selectedDateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const calDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const calFirstDay = new Date(calYear, calMonth, 1).getDay()
  const calDays = Array.from({ length: calDaysInMonth }, (_, i) => i + 1)
  const calPadding = Array.from({ length: calFirstDay === 0 ? 6 : calFirstDay - 1 }, (_, i) => null)
  const calGrid = [...calPadding, ...calDays]

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1) }
    else { setCalMonth(calMonth - 1) }
  }
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1) }
    else { setCalMonth(calMonth + 1) }
  }

  const fetchAllTasks = () => {
    Promise.all([
      getTodayFollowUps().catch(() => []),
      getTomorrowFollowUps().catch(() => []),
      getOverdueFollowUps().catch(() => []),
      getUpcomingFollowUps().catch(() => []),
    ]).then(([todayData, tomorrowData, overdueData, upcomingData]) => {
      const today = Array.isArray(todayData) ? todayData : []
      const tomorrow = Array.isArray(tomorrowData) ? tomorrowData : []
      const overdue = Array.isArray(overdueData) ? overdueData : []
      const upcoming = Array.isArray(upcomingData) ? upcomingData : []

      setTodayTasks(today)
      setTomorrowTasks(tomorrow)
      setOverdueTasks(overdue)
      setUpcomingTasks(upcoming)
      setCompletedTasks([
        ...today.filter(t => t.status === 'completed'),
        ...tomorrow.filter(t => t.status === 'completed'),
        ...overdue.filter(t => t.status === 'completed'),
        ...upcoming.filter(t => t.status === 'completed'),
      ])
    })
  }

  useEffect(() => {
    setLoading(true)
    fetchAllTasks().finally(() => setLoading(false))
  }, [])

  const completeTask = async (task) => {
    try {
      await updateFollowUp(task.id, { status: 'completed', completedAt: new Date().toISOString() })
      fetchAllTasks()
    } catch (err) {
      notify.error(err.message || 'Failed to complete task')
    }
  }

  const toTitleCase = (s) =>
    s ? s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : ''

  const getTaskTitle = (task) => {
    const typeLabel = toTitleCase(task.type || 'Follow-Up')
    const leadName = task.leadName || 'Lead'
    return `${typeLabel} — ${leadName}`
  }

  const getTaskPriority = (task) => {
    if (task.priority) return task.priority
    if (task.type === 'call') return 'high'
    if (task.type === 'meeting') return 'medium'
    return 'low'
  }

  const activeTodayTasks = todayTasks.filter(t => t.status !== 'completed')

  return (
    <div className="min-h-screen bg-[#eef3f8] text-slate-950">
      <div className="flex h-screen overflow-hidden">
        <AgentSidebar agentName={agentName} initials={initials} />

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f6fafe]">
          <CommonHeader
            title="My Action Items"
            searchValue={headerSearch}
            onSearchChange={setHeaderSearch}
            searchPlaceholder="Search tasks or leads..."
            compact
          />

          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-7xl space-y-6">
              <div className="flex items-center gap-2 rounded-xl bg-white p-1.5 border border-slate-200 w-fit shadow-sm">
                {dates.map((d) => (
                  <button
                    key={d}
                    onClick={() => setActiveDate(d)}
                    className={`px-6 py-2 rounded-lg text-[12px] font-bold transition ${
                      activeDate === d
                        ? 'bg-white text-brand-700 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-7 space-y-4">
                  {activeDate === 'Today' && (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-3 rounded-full bg-orange-600" />
                          <h3 className="text-lg font-bold">Today's Tasks</h3>
                          <span className="rounded-full bg-orange-50 px-3 py-0.5 text-[10px] font-bold text-orange-700">
                            {activeTodayTasks.length} ACTIVE
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {activeTodayTasks.length === 0 ? (
                          <p className="text-sm text-slate-400 text-center py-8">No tasks for today</p>
                        ) : (
                          activeTodayTasks.map((task) => {
                            const TaskIcon = taskTypeIcons[task.type] || ClipboardList
                            const priority = getTaskPriority(task)
                            return (
                              <div
                                key={task.id}
                                className={`bg-white rounded-lg shadow-sm p-4 flex items-center gap-4 transition-all border border-slate-200 ${priorityBorder[priority]} hover:shadow-md`}
                              >
                                <div className={`rounded-lg p-2.5 ${priorityIconBg[priority]}`}>
                                  <TaskIcon size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="font-bold text-[13px] text-slate-900">
                                      {getTaskTitle(task)}
                                    </span>
                                    <span className="flex items-center gap-1 text-[11px] text-slate-500 shrink-0">
                                      <Clock size={12} />
                                      {new Date(task.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="text-[12px] text-slate-500 mt-0.5">{task.notes || 'No notes'}</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <label className="relative inline-flex cursor-pointer items-center">
                                    <input
                                      type="checkbox"
                                      className="peer sr-only"
                                      onChange={() => completeTask(task)}
                                    />
                                    <div className="h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-brand-700 peer-checked:after:translate-x-full" />
                                  </label>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </>
                  )}

                  {activeDate === 'Tomorrow' && (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-3 rounded-full bg-blue-600" />
                          <h3 className="text-lg font-bold">Tomorrow's Tasks</h3>
                          <span className="rounded-full bg-blue-50 px-3 py-0.5 text-[10px] font-bold text-blue-700">
                            {tomorrowTasks.filter(t => t.status !== 'completed').length} UPCOMING
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {tomorrowTasks.filter(t => t.status !== 'completed').length === 0 ? (
                          <p className="text-sm text-slate-400 text-center py-8">No tasks for tomorrow</p>
                        ) : (
                          tomorrowTasks.filter(t => t.status !== 'completed').map((task) => {
                            const TaskIcon = taskTypeIcons[task.type] || ClipboardList
                            return (
                              <div
                                key={task.id}
                                className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4 transition-all border border-slate-200 border-l-4 border-l-blue-600 hover:shadow-md"
                              >
                                <div className="rounded-lg p-2.5 bg-blue-50 text-blue-600">
                                  <TaskIcon size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="font-bold text-[13px] text-slate-900">
                                      {getTaskTitle(task)}
                                    </span>
                                    <span className="flex items-center gap-1 text-[11px] text-slate-500 shrink-0">
                                      <Clock size={12} />
                                      {new Date(task.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="text-[12px] text-slate-500 mt-0.5">{task.notes || 'No notes'}</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <label className="relative inline-flex cursor-pointer items-center">
                                    <input
                                      type="checkbox"
                                      className="peer sr-only"
                                      onChange={() => completeTask(task)}
                                    />
                                    <div className="h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-brand-700 peer-checked:after:translate-x-full" />
                                  </label>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </>
                  )}

                  {activeDate === 'This Week' && (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-3 rounded-full bg-purple-600" />
                          <h3 className="text-lg font-bold">This Week</h3>
                          <span className="rounded-full bg-purple-50 px-3 py-0.5 text-[10px] font-bold text-purple-700">
                            {upcomingTasks.filter(t => t.status !== 'completed').length} TASKS
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {upcomingTasks.filter(t => t.status !== 'completed').length === 0 ? (
                          <p className="text-sm text-slate-400 text-center py-8">No upcoming tasks this week</p>
                        ) : (
                          upcomingTasks.filter(t => t.status !== 'completed').map((task) => {
                            const TaskIcon = taskTypeIcons[task.type] || ClipboardList
                            return (
                              <div
                                key={task.id}
                                className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4 transition-all border border-slate-200 border-l-4 border-l-purple-600 hover:shadow-md"
                              >
                                <div className="rounded-lg p-2.5 bg-purple-50 text-purple-600">
                                  <TaskIcon size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="font-bold text-[13px] text-slate-900">
                                      {getTaskTitle(task)}
                                    </span>
                                    <span className="flex items-center gap-1 text-[11px] text-slate-500 shrink-0">
                                      <Clock size={12} />
                                      {new Date(task.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </span>
                                  </div>
                                  <p className="text-[12px] text-slate-500 mt-0.5">{task.notes || 'No notes'}</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <label className="relative inline-flex cursor-pointer items-center">
                                    <input
                                      type="checkbox"
                                      className="peer sr-only"
                                      onChange={() => completeTask(task)}
                                    />
                                    <div className="h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-brand-700 peer-checked:after:translate-x-full" />
                                  </label>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </>
                  )}

                  {activeDate === 'Yesterday' && (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-3 rounded-full bg-slate-400" />
                          <h3 className="text-lg font-bold">Yesterday</h3>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 text-center py-8">View completed tasks in the History section below</p>
                    </>
                  )}
                </div>

                <div className="col-span-12 lg:col-span-5 space-y-6">
                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="bg-brand-700 p-4 flex items-center justify-between">
                      <h3 className="flex items-center gap-2 font-bold text-sm text-white">
                        <Calendar size={16} />
                        Upcoming Follow-Ups
                      </h3>
                    </div>

                    <div className="border-b border-slate-100 p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">{monthNames[calMonth]} {calYear}</span>
                        <div className="flex gap-1">
                          <button onClick={prevMonth} className="rounded p-1 hover:bg-slate-100 text-slate-500">
                            <ChevronLeft size={14} />
                          </button>
                          <button onClick={nextMonth} className="rounded p-1 hover:bg-slate-100 text-slate-500">
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400">
                        {weekDays.map((d) => (
                          <div key={d}>{d}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center">
                        {calGrid.map((day, i) => (
                          <div
                            key={i}
                            onClick={() => day !== null && setSelectedDay(day)}
                            className={`rounded-lg p-2 text-[12px] ${
                              day === null
                                ? ''
                                : day === selectedDay && calMonth === today.getMonth() && calYear === today.getFullYear()
                                  ? 'bg-brand-700 font-bold text-white shadow-sm'
                                  : day === selectedDay
                                    ? 'bg-brand-100 font-bold text-brand-800'
                                    : 'hover:bg-slate-50 cursor-pointer text-slate-700'
                            }`}
                          >
                            {day ?? ''}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 space-y-4">
                      {[...todayTasks, ...tomorrowTasks, ...upcomingTasks]
                        .filter(t => t.scheduledAt && new Date(t.scheduledAt).toISOString().slice(0, 10) === selectedDateStr && t.status !== 'completed')
                        .length === 0 ? (
                        <p className="text-[12px] text-slate-400 text-center py-4">No follow-ups for this date.</p>
                      ) : (
                        [...todayTasks, ...tomorrowTasks, ...upcomingTasks]
                          .filter(t => t.scheduledAt && new Date(t.scheduledAt).toISOString().slice(0, 10) === selectedDateStr && t.status !== 'completed')
                          .map((task) => (
                            <div key={task.id} className="flex items-center gap-3">
                              <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
                                {task.leadName ? task.leadName.split(' ').map((p) => p[0]).join('').slice(0, 2) : 'NA'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-[13px] text-slate-900">{getTaskTitle(task)}</p>
                                <p className="text-[11px] text-slate-500">{task.notes || 'No notes'}</p>
                              </div>
                              <span className="rounded bg-brand-50 px-2 py-1 text-[10px] font-bold text-brand-700">
                                {new Date(task.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl bg-gradient-to-br from-brand-700 to-blue-800 p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                      <h4 className="text-base font-bold mb-1">Weekly Summary</h4>
                      <p className="text-blue-200 text-[12px] mb-4">
                        You've completed {completedTasks.length} task{completedTasks.length !== 1 ? 's' : ''} this session.
                      </p>
                      <div className="mb-6 h-2 w-full rounded-full bg-white/20">
                        <div className="h-2 rounded-full bg-white" style={{ width: `${todayTasks.length + tomorrowTasks.length + overdueTasks.length + upcomingTasks.length > 0 ? Math.round((completedTasks.length / (todayTasks.length + tomorrowTasks.length + overdueTasks.length + upcomingTasks.length)) * 100) : 0}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Overdue Section */}
              {overdueTasks.length > 0 && (
                <div className="rounded-xl border border-red-200 bg-white overflow-hidden">
                  <button
                    onClick={() => setOverdueOpen(!overdueOpen)}
                    className="flex w-full items-center justify-between bg-red-50/50 p-4 hover:bg-red-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                      <h3 className="font-bold text-red-600 text-sm">Overdue Tasks ({overdueTasks.length})</h3>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`text-red-500 transition-transform ${overdueOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {overdueOpen && (
                    <div className="border-t border-red-100 divide-y divide-slate-100">
                      {overdueTasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <AlertTriangle size={16} className="text-red-500" />
                            <div>
                              <p className="text-[13px] font-bold text-slate-900">{getTaskTitle(task)}</p>
                              <p className="text-[11px] font-medium text-red-600">
                                Due: {new Date(task.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => completeTask(task)}
                              className="rounded bg-red-500 px-4 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-red-600 transition-colors"
                            >
                              Mark Done
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Completed / History Section */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <button
                  onClick={() => setCompletedOpen(!completedOpen)}
                  className="flex w-full items-center justify-between bg-emerald-50/50 p-4 hover:bg-emerald-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle size={18} className="text-emerald-500" />
                    <h3 className="font-bold text-emerald-700 text-sm">Completed ({completedTasks.length})</h3>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`text-emerald-500 transition-transform ${completedOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {completedOpen && (
                  <div className="border-t border-slate-100 divide-y divide-slate-100">
                    {completedTasks.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-6">No completed tasks yet</p>
                    ) : (
                      completedTasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-4 bg-slate-50 opacity-70">
                          <div className="flex items-center gap-4">
                            <CheckCircle size={16} className="text-emerald-500" />
                            <div>
                              <p className="text-[13px] font-bold text-slate-600 line-through">{getTaskTitle(task)}</p>
                              <p className="text-[11px] text-slate-400">
                                Completed {task.completedAt ? formatTimeAgo(task.completedAt) : ''}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
