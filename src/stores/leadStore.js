import { useState, useEffect } from 'react'

const initialLeads = [
  { name: 'Marcus Richardson', phone: '+1 (555) 012-3456', product: 'Wealth Mgmt', priority: 'hot', status: 'IN PROGRESS', due: 'Today', initials: 'MR' },
  { name: 'Elena Moretti', phone: '+1 (555) 789-1023', product: 'SME Loan', priority: 'medium', status: 'NEW LEAD', due: 'Oct 24, 2023', initials: 'EM' },
  { name: 'Jameson Dunn', phone: '+1 (555) 456-7890', product: 'Auto Insurance', priority: 'low', status: 'CONVERTED', due: 'Oct 20, 2023', initials: 'JD' },
  { name: 'Sarah Jenkins', phone: '+1 (555) 321-6543', product: 'Home Mortgage', priority: 'hot', status: 'QUALIFYING', due: 'Today', initials: 'SJ' },
]

const leads = [...initialLeads]
const listeners = new Set()

function notify() {
  listeners.forEach((fn) => fn())
}

export function getLeads() {
  return leads
}

export function getLeadBySlug(slug) {
  return leads.find((l) => l.name.toLowerCase().replace(/\s+/g, '-') === slug) || null
}

export function updateLeadStatus(name, newStatus) {
  const idx = leads.findIndex((l) => l.name === name)
  if (idx === -1) return false
  leads[idx] = { ...leads[idx], status: newStatus }
  notify()
  return true
}

export function addFollowUp(name, entry) {
  const idx = leads.findIndex((l) => l.name === name)
  if (idx === -1) return false
  if (!leads[idx].followUps) leads[idx].followUps = []
  leads[idx].followUps.push(entry)
  if (entry.type) {
    leads[idx] = { ...leads[idx], status: entry.type, followUps: leads[idx].followUps }
  } else {
    leads[idx] = { ...leads[idx], followUps: leads[idx].followUps }
  }
  notify()
  return true
}

export function useLeads() {
  const [, setTick] = useState(0)
  useEffect(() => {
    const handler = () => setTick((t) => t + 1)
    listeners.add(handler)
    return () => listeners.delete(handler)
  }, [])
  return leads
}

export function useLead(slug) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const handler = () => setTick((t) => t + 1)
    listeners.add(handler)
    return () => listeners.delete(handler)
  }, [])
  return getLeadBySlug(slug)
}
