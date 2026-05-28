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
    name: 'Alex Martinez',
    email: 'alex.m@agency.com',
    contact: '(555) 0123-4567',
    state: 'CA',
    level: 'ID: AGT-2321',
    status: 'Onboarding',
    progress: 60,
    updated: 'Oct 15, 2024',
    initials: 'AM',
    licenceExpiry: 'Oct 15, 2024'
  },
  {
    name: 'Sarah Williams',
    email: 's.williams@global.com',
    contact: '(555) 0123-8988',
    state: 'NY',
    level: 'ID: AGT-1102',
    status: 'Under Review',
    progress: 20,
    updated: 'Dec 01, 2024',
    initials: 'SW',
    licenceExpiry: 'Dec 01, 2024'
  },
  {
    name: 'James King',
    email: 'james.k@prime.com',
    contact: '(555) 0123-1122',
    state: 'IL',
    level: 'ID: AGT-4402',
    status: 'Active',
    progress: 100,
    updated: 'Expired (3d)',
    initials: 'JK',
    licenceExpiry: 'Expired (3d)'
  }
  ,
  {
    name: 'Linda Chen',
    email: 'linda.c@nextgen.com',
    contact: '(555) 0123-5566',
    state: 'WA',
    level: 'ID: AGT-5512',
    status: 'Prospect',
    progress: 5,
    updated: 'N/A',
    initials: 'LC',
    licenceExpiry: 'N/A'
  }
]
