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
  { label: 'Total Agents', value: '48', delta: '+4% vs last month' },
  { label: 'Onboarding In Progress', value: '12' },
  { label: 'Pending Approvals', value: '5' },
  { label: 'Licences Expiring', value: '3' }
]

export const dashboardModuleCounts = {
  totalLeads: 124,
  totalClients: 86,
  totalPolicies: 52,
}

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
    name: 'Sarah Miller',
    email: 's.miller@insurance.com',
    phone: '+1 (555) 123-4567',
    state: 'TX, FL',
    level: 'Level 4',
    status: 'Active',
    statusTone: 'green',
    updated: '3h ago',
    initials: 'SM',
    agentId: 'AGT-9921',
    licenceExpiry: 'Oct 12, 2025',
    onboardingProgress: 100,
    onboardingLabel: 'Completed'
  },
  {
    name: 'James Bennett',
    email: 'j.bennett@agency.co',
    phone: '+1 (555) 987-6543',
    state: 'NY',
    level: 'Level 2',
    status: 'Pending',
    statusTone: 'amber',
    updated: '3h ago',
    initials: 'JB',
    agentId: 'AGT-9922',
    licenceExpiry: 'Nov 04, 2024',
    onboardingProgress: 45,
    onboardingLabel: '45% In Progress'
  },
  {
    name: 'Linda Wu',
    email: 'linda.wu@service.net',
    phone: '+1 (555) 246-8135',
    state: 'CA',
    level: 'Level 5',
    status: 'Active',
    statusTone: 'green',
    updated: 'Yesterday',
    initials: 'LW',
    agentId: 'AGT-9923',
    licenceExpiry: 'Jan 18, 2026',
    onboardingProgress: 100,
    onboardingLabel: 'Completed'
  }
]
