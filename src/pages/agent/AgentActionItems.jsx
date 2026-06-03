import { useState } from 'react'
import {
  Phone,
  Mail,
  FileText,
  Clock,
  MoreHorizontal,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Settings,
  Filter,
  AlertTriangle,
  ChevronDown,
  TrendingUp,
  Plus,
} from 'lucide-react'
import { auth } from '../../utils/auth.js'
import AgentSidebar from '../../components/AgentSidebar.jsx'
import CommonHeader from '../../components/CommonHeader.jsx'

const todayTasks = [
  {
    title: 'Call Back: Jonathan Sterling',
    desc: 'Discuss mortgage pre-approval docs for Waterfront Property.',
    time: '10:30 AM',
    priority: 'high',
    icon: Phone,
  },
  {
    title: 'Email Campaign Launch',
    desc: 'Send out the Q4 Real Estate market report to VIP leads.',
    time: '01:15 PM',
    priority: 'medium',
    icon: Mail,
  },
  {
    title: 'Contract Review: Unit 402',
    desc: 'Review final revisions on the downtown condo purchase agreement.',
    time: '04:00 PM',
    priority: 'low',
    icon: FileText,
  },
]

const defaultFollowUps = [
  { name: 'Sarah Jenkins', desc: "Meeting @ Starbuck's Main", time: '2:30 PM', date: '2026-05-29' },
  { name: 'Marcus Thorne', desc: 'Financial Review Call', time: '5:00 PM', date: '2026-05-29' },
]

const overdueTasks = [
  { title: 'Submit Appraisal: 124 Oak St.', due: 'Yesterday, 5:00 PM' },
  { title: 'Update CRM: Green Property Group', due: 'Oct 29, 11:00 AM' },
]

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
  const [followUps, setFollowUps] = useState(defaultFollowUps)
  const [overdueOpen, setOverdueOpen] = useState(false)
  const [completedTasks, setCompletedTasks] = useState({})
  const [headerSearch, setHeaderSearch] = useState('')

  const selectedDateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
  const filteredFollowUps = followUps.filter((f) => f.date === selectedDateStr)

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

  const toggleTask = (idx) => {
    setCompletedTasks((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }

  const addFollowUp = () => {
    const count = followUps.length + 1
    setFollowUps((prev) => [
      ...prev,
      { name: `Follow-Up #${count}`, desc: 'New action item', time: 'TBD', date: selectedDateStr },
    ])
  }

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
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-3 rounded-full bg-orange-600" />
                    <h3 className="text-lg font-bold">Today's Tasks</h3>
                    <span className="rounded-full bg-orange-50 px-3 py-0.5 text-[10px] font-bold text-orange-700">
                      12 ACTIVE
                    </span>
                  </div>
                  <button className="flex items-center gap-1 text-[11px] font-bold text-brand-700 hover:underline">
                    <Filter size={13} />
                    SORT BY PRIORITY
                  </button>
                </div>

                <div className="space-y-3">
                  {todayTasks.map((task, idx) => {
                    const TaskIcon = task.icon
                    const isDone = completedTasks[idx]
                    return (
                      <div
                        key={idx}
                        className={`bg-white rounded-lg shadow-sm p-4 flex items-center gap-4 transition-all border border-slate-200 ${
                          priorityBorder[task.priority]
                        } ${isDone ? 'opacity-50 grayscale' : 'hover:shadow-md'}`}
                      >
                        <div className={`rounded-lg p-2.5 ${priorityIconBg[task.priority]}`}>
                          <TaskIcon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-4">
                            <span className={`font-bold text-[13px] text-slate-900 ${isDone ? 'line-through' : ''}`}>
                              {task.title}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-slate-500 shrink-0">
                              <Clock size={12} />
                              {task.time}
                            </span>
                          </div>
                          <p className={`text-[12px] text-slate-500 mt-0.5 ${isDone ? 'line-through' : ''}`}>
                            {task.desc}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={!!isDone}
                              onChange={() => toggleTask(idx)}
                            />
                            <div className="h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-brand-700 peer-checked:after:translate-x-full" />
                          </label>
                          <button className="text-slate-400 hover:text-slate-700">
                            <MoreHorizontal size={16} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="col-span-12 lg:col-span-5 space-y-6">
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="bg-brand-700 p-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-bold text-sm text-white">
                      <Calendar size={16} />
                      Upcoming Follow-Ups
                    </h3>
                    <button className="text-white/70 hover:text-white">
                      <Settings size={14} />
                    </button>
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
                    {filteredFollowUps.length === 0 ? (
                      <p className="text-[12px] text-slate-400 text-center py-4">No follow-ups for this date.</p>
                    ) : (
                      filteredFollowUps.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
                            {item.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[13px] text-slate-900">{item.name}</p>
                            <p className="text-[11px] text-slate-500">{item.desc}</p>
                          </div>
                          <span className="rounded bg-brand-50 px-2 py-1 text-[10px] font-bold text-brand-700">
                            {item.time}
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
                      You've completed 78% of your leads follow-ups this week.
                    </p>
                    <div className="mb-6 h-2 w-full rounded-full bg-white/20">
                      <div className="h-2 w-[78%] rounded-full bg-white" />
                    </div>
                    <button className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-[11px] font-bold text-brand-700 hover:bg-opacity-90">
                      <TrendingUp size={14} />
                      VIEW PERFORMANCE
                    </button>
                  </div>
                  <div className="absolute -bottom-6 -right-6 text-[100px] opacity-10 rotate-12 pointer-events-none">
                    <TrendingUp size={100} />
                  </div>
                </div>
              </div>
            </div>

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
                  {overdueTasks.map((task, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <AlertTriangle size={16} className="text-red-500" />
                        <div>
                          <p className="text-[13px] font-bold text-slate-900">{task.title}</p>
                          <p className="text-[11px] font-medium text-red-600">Due: {task.due}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="rounded px-4 py-1.5 text-[11px] font-bold text-brand-700 hover:bg-brand-50 transition-colors">
                          Reschedule
                        </button>
                        <button className="rounded bg-red-500 px-4 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-red-600 transition-colors">
                          Mark Done
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          </div>

          <button
            onClick={addFollowUp}
            className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-700 text-white shadow-2xl transition-all hover:scale-110 active:scale-95 group"
          >
            <Plus size={28} />
            <span className="absolute right-full mr-4 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
              Add Action Item
            </span>
          </button>
        </main>
      </div>
    </div>
  )
}
