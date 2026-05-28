// All dummy data lives here. Replace each export with an API call later.

export const masterStats = [
  { label: 'Total Admins', value: '124', delta: '+4%', tone: 'blue' },
  { label: 'Active Admins', value: '98', delta: null, tone: 'green' },
  { label: 'Total Agents', value: '12,402', delta: '+12%', tone: 'indigo' },
  { label: 'Pending Onboardings', value: '45', delta: null, tone: 'amber' },
  { label: 'Compliance Alerts', value: '12', delta: 'Urgent', tone: 'red' }
]

export const auditLogs = [
  {
    timestamp: '2023-11-24 14:22:11',
    admin: { name: 'Jonathan V.', initials: 'JV' },
    action: 'Role Update',
    entity: 'MGA Central Office',
    status: 'Success'
  },
  {
    timestamp: '2023-11-24 13:05:45',
    admin: { name: 'Sarah Jenkins', initials: 'SJ' },
    action: 'Policy Breach Alert',
    entity: 'Agent #99283 - CA',
    status: 'Critical'
  },
  {
    timestamp: '2023-11-24 11:58:30',
    admin: { name: 'Michael Ross', initials: 'MR' },
    action: 'Mass Deployment',
    entity: 'Compliance Training v2.4',
    status: 'Processing'
  },
  {
    timestamp: '2023-11-24 10:45:12',
    admin: { name: 'Elena Gupta', initials: 'EG' },
    action: 'New Admin Created',
    entity: 'Regional Mgr - SE',
    status: 'Success'
  }
]

export const adminStats = [
  { label: 'Total Agents', value: '2,482', delta: '+10%' },
  { label: 'Pending', value: '48' },
  { label: 'Under Review', value: '15' },
  { label: 'Approved', value: '124' },
  { label: 'Expiring', value: '03' }
]

export const onboardingPipeline = [
  { label: 'Submitted', value: 12 },
  { label: 'Under Review', value: 8 },
  { label: 'Approved', value: 4 },
  { label: 'Active', value: 32 }
]

export const recentSubmissions = [
  { name: 'Marcus Holloway', app: 'App #9921', submitted: '2h ago', tag: 'NEW' },
  { name: 'Elena Rodriguez', app: 'App #9922', submitted: '3h ago', tag: 'NEW' }
]

export const complianceAlerts = [
  {
    type: 'critical',
    title: 'License Expired: David Kim',
    body: 'State of California license #4234-99 lapsed today.',
    actions: ['Suspend Agent', 'Notify']
  },
  {
    type: 'warning',
    title: 'Signature Missing',
    body: 'Agent #2298 has not signed the revised MGA agreement.'
  },
  {
    type: 'info',
    title: 'Background Check Pass',
    body: 'Concordia Roy verified by Identity Integration Systems.'
  }
]

export const trainingCompletion = {
  percent: 84,
  target: 'Target Met',
  modules: [
    { label: 'Anti-Money Laundering', percent: 92 },
    { label: 'Cybersecurity Basics', percent: 76 }
  ]
}

export const recentAgents = [
  {
    name: 'Jonathan Doe',
    email: 'john@agency.com',
    state: 'TX, FL',
    level: 'Level 4',
    status: 'Training',
    statusTone: 'gray',
    updated: '3h ago',
    initials: 'JD'
  },
  {
    name: 'Alice Miller',
    email: 'a.miller@partner.net',
    state: 'NY',
    level: 'Level 2',
    status: 'Active',
    statusTone: 'green',
    updated: '3h ago',
    initials: 'AM'
  },
  {
    name: 'Robert Wong',
    email: 'r.wong@firm.io',
    state: 'CA',
    level: 'Level 5',
    status: 'Contract Expiring',
    statusTone: 'red',
    updated: 'Yesterday',
    initials: 'RW'
  }
]
