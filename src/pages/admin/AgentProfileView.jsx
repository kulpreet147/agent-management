import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Mail, Phone, MapPin, BriefcaseBusiness, UserRound,
  ShieldCheck, FileText, Settings, Activity, TrendingUp, TrendingDown,
  Target, Award, BookOpen, AlertTriangle, CheckCircle2, Clock,
  Download, Upload, Eye, MoreHorizontal, Bell, Edit2,
  Users, Star, Zap, BarChart2, Calendar, Flag, Paperclip,
  ChevronRight, RefreshCw, Lock, Globe, Linkedin, Instagram,
  Youtube, Twitter, Plus, X, Building2, CreditCard, Hash,
} from 'lucide-react'
import { useToast } from '../../hooks/useToast.js'
import { auth } from '../../utils/auth.js'
import { confirmDialog } from '../../utils/confirmDialog.js'
import { getAgent, getAgentProfile, updateAgentProfile, decideAgentTierRequest, getAgentPerformance, updateAgentLicensing, updateAgentTaxDocuments, updateAgentLifecycleStatus } from '../../utils/agents.js'
import { getAccountActivities, updateAccountActivity } from '../../utils/activities.js'

// ─── Mock dynamic data ────────────────────────────────────────────────────────

function normalizeList(value) {
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string') return value.split(',').map(item => item.trim()).filter(Boolean)
  return []
}

function normalizeDesignations(value) {
  if (!Array.isArray(value)) return []
  return value
    .map(item => (typeof item === 'string' ? { name: item, full: item, date: '', status: '' } : item))
    .filter(item => item?.name || item?.full)
}

function toTitleCase(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatDateValue(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

function parseLicenceDetails(value) {
  const text = String(value || '')
  return {
    expiry: text.match(/Expiry:\s*([^|]+)/i)?.[1]?.trim() || '',
    type: text.match(/Type:\s*([^|]+)/i)?.[1]?.trim() || '',
  }
}

function resolveMediaUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000/api'
  const origin = apiBase.replace(/\/api\/?$/, '')
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`
}

function readAvatarPathFromAgent(agent) {
  const avatar = agent?.documents?.profileAvatar
  if (!avatar) return ''
  if (avatar.fileName) return `/uploads/agents/${avatar.fileName}`
  if (avatar.path) {
    const normalized = String(avatar.path).replace(/\\/g, '/')
    const idx = normalized.indexOf('/uploads/')
    if (idx >= 0) return normalized.slice(idx)
  }
  return ''
}

// Flattens the structured residential address (new profile shape) into one line.
function formatAddressLine(addr) {
  if (!addr || typeof addr !== 'object') return ''
  return [
    addr.unit,
    [addr.streetNumber, addr.streetName].filter(Boolean).join(' '),
    addr.city,
    addr.province,
    addr.postalCode,
    addr.country,
  ]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(', ')
}

// Emergency contact may be a string (legacy) or an object {name, phone, relationship}
// (new profile shape). Always return plain strings so it can render as a React child.
function deriveEmergency(personal = {}, relationships = {}) {
  const ec = personal.emergencyContact
  const obj = ec && typeof ec === 'object' ? ec : null
  const contact =
    (obj ? obj.name : ec) ||
    personal.emergencyContactName ||
    relationships.spouse?.name ||
    personal.spouseName ||
    ''
  const phone =
    (obj ? obj.phone : '') || personal.emergencyContactPhone || personal.emergencyPhone || ''
  const relation =
    (obj ? obj.relationship : '') ||
    personal.emergencyRelation ||
    personal.emergencyContactRelation ||
    (contact ? 'Spouse' : '')
  return { contact: String(contact || ''), phone: String(phone || ''), relation: String(relation || '') }
}

function buildMockData(agent) {
  const name = agent?.name || 'Agent'
  const initials = name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  const savedProfile = agent?.documents?.profile || {}
  const personal = savedProfile.personal || {}
  const professional = savedProfile.professional || {}
  const business = savedProfile.business || {}
  const online = savedProfile.online || {}
  const settingsBlock = savedProfile.settings || {}
  const savedLicensing = (agent?.documents?.licensing || {})
  const savedTaxDocuments = Array.isArray(agent?.documents?.taxDocuments) ? agent.documents.taxDocuments : []
  const relationships = savedProfile.relationships || {}
  const socials = business.socials || business.social || online || {}
  const licenceDetails = parseLicenceDetails(professional.licenceDetails)
  const emergency = deriveEmergency(personal, relationships)
  const emergencyContact = emergency.contact
  const emergencyRelation = emergency.relation
  const subscriptionTier = agent?.subscriptionTier || savedProfile.settings?.subscriptionTier || savedProfile.subscriptionTier || 'Silver'
  return {
    initials,
    avatarUrl: resolveMediaUrl(readAvatarPathFromAgent(agent)),
    tier: subscriptionTier,
    status: agent?.lifecycleStatus ? toTitleCase(agent.lifecycleStatus) : agent?.accountActivationStatus === 1 ? 'Active' : agent?.status || 'Invited',
    title: agent?.agentLevel || 'Agent',
    licenceNo: agent?.agentId || 'LIC-99021-X',
    licenceStatus: 'Valid',
    provinces: ['ON', 'BC', 'AB'],
    clients: agent?.clientsCount ? `${agent.clientsCount} Active` : '0 Active',
    lastLogin: agent?.lastLogin ? formatDateValue(agent.lastLogin) : '',
    lastLoginWarning: !agent?.lastLogin,
    phone: personal.personalPhone || personal.businessPhone || agent?.phone || '',
    email: agent?.email || personal.personalEmail || '',
    company: agent?.insuranceCompany || '',
    agentCode: agent?.agentCode || '',

    performance: {
      alert: {
        type: 'warning',
        title: 'Attention Required: License Renewal Approaching',
        body: 'The British Columbia Life Insurance license for Mike Johnson will expire in 14 days. Ensure all continuing education credits are uploaded to avoid suspension of agency status.',
      },
      stats: [
        { label: 'Login Activity', value: '4.2', unit: 'avg/day', delta: '-12% vs last week', deltaUp: false, icon: Activity, color: 'blue' },
        { label: 'Leads Contacted', value: '164', unit: '/ 200', delta: '82% of target', deltaUp: true, icon: Target, color: 'green' },
        { label: 'Conversion Efficiency', value: '18.4%', unit: '', delta: '+2.4% yield', deltaUp: true, icon: TrendingUp, color: 'violet' },
        { label: 'Quotes Generated', value: '342', unit: '', delta: 'Top Product: Term Life (60%)', deltaUp: true, icon: BarChart2, color: 'sky' },
        { label: 'Policies Bound', value: '28', unit: '', delta: '$42,500 GWP MTD', deltaUp: true, icon: Award, color: 'emerald' },
        { label: 'Training Pipeline', value: 'Compliance 2024', unit: '', delta: '65% Complete', deltaUp: null, icon: BookOpen, color: 'amber', progress: 65 },
      ],
      notes: [
        { author: 'Sarah Jenkins (Admin)', time: 'Oct 12, 2:00 PM', type: 'admin', text: 'Conducted quarterly review. Mike is consistently hitting lead targets but needs to focus on the follow-up timeline. Mentioned the upcoming license renewal.' },
        { author: 'System Automated', time: 'Oct 01, 9:00 AM', type: 'system', title: 'License Expiry Warning Triggered', text: 'Automated email sent to agent regarding BC license expiry in 30 days.' },
      ],
    },

    profile: {
      personal: {
        fullName: name !== 'Agent' ? name : [personal.firstName, personal.lastName].filter(Boolean).join(' ') || name,
        firstName: personal.firstName || '',
        lastName: personal.lastName || '',
        preferredName: personal.preferredName || '',
        gender: personal.gender || '',
        maritalStatus: personal.maritalStatus || '',
        personalEmail: agent?.email || personal.email || personal.personalEmail || '',
        personalPhone: personal.primaryPhone || personal.personalPhone || agent?.phone || '',
        secondaryPhone: personal.secondaryPhone || '',
        businessPhone: business.businessPhone || personal.businessPhone || '',
        mailingAddress: business.mailingAddress || personal.businessAddress || personal.mailingAddress || formatAddressLine(personal.address) || '',
        address: {
          unit: personal.address?.unit || '',
          streetNumber: personal.address?.streetNumber || '',
          streetName: personal.address?.streetName || '',
          city: personal.address?.city || personal.city || '',
          province: personal.address?.province || personal.province || '',
          country: personal.address?.country || '',
          postalCode: personal.address?.postalCode || personal.postalCode || '',
        },
        city: personal.address?.city || personal.city || '',
        province: personal.address?.province || personal.province || '',
        postalCode: personal.address?.postalCode || personal.postalCode || '',
        residence: personal.residence || '',
        emergencyContact,
        emergencyPhone: emergency.phone,
        emergencyRelation,
        dob: formatDateValue(personal.dob || personal.dateOfBirth || ''),
        bio: business.bio || professional.bio || '',
        expertise: normalizeList((business.specializations?.length ? business.specializations : null) || professional.expertise || business.expertise || personal.expertise),
      },
      family: Array.isArray(savedProfile.family) ? savedProfile.family : [],
      professional: {
        licenceNo: agent?.agentId || 'LIC-99021-X',
        licenceType: agent?.licenceType || licenceDetails.type || '',
        licenceExpiry: professional.licenceExpiry || licenceDetails.expiry || '',
        company: agent?.insuranceCompany || '',
        agentCode: agent?.agentCode || '',
        yearsExp: business.yearsExperience || professional.yearsOfExperience || '',
        mga: agent?.mga || agent?.insuranceCompany || '',
        designations: normalizeDesignations((business.designations?.length ? business.designations : null) || professional.designations),
        certifications: ['LLQP — Life Licence Qualification', 'AML Compliance (2024)', 'E&O Coverage Active'],
        awards: ['Top Producer 2023 — HUB Financial', 'Client Satisfaction Award Q2 2023'],
      },
      business: {
        businessName: '',
        operatingName: business.operatingName || '',
        mailingAddress: business.mailingAddress || '',
        businessPhone: business.businessPhone || personal.businessPhone || '',
        businessEmail: business.businessEmail || '',
        businessAddress: '',
        website: '',
        yearsExperience: business.yearsExperience || professional.yearsOfExperience || '',
        specializations: normalizeList(business.specializations),
        products: normalizeList(business.productsOffered || business.products),
        serviceAreas: normalizeList(business.serviceAreas),
        languages: normalizeList(business.languages),
        awards: normalizeList(business.awards),
        social: {
          linkedin: '',
          facebook: '',
          instagram: '',
          twitter: '',
          youtube: '',
          tiktok: '',
          website: '',
          otherProfiles: '',
          bookingLink: '',
        },
      },
    },

    licensing: {
      provinces: Array.isArray(savedLicensing.provinces) ? savedLicensing.provinces : [],
      carriers: Array.isArray(savedLicensing.carriers) ? savedLicensing.carriers : [],
      ceCredits: Array.isArray(savedLicensing.ceCredits) ? savedLicensing.ceCredits : [],
      renewal: savedLicensing.renewal || {},
      // Licence info derived from the agent record captured during onboarding.
      licence: {
        type: agent?.licenceType || '',
        number: agent?.agentId || '',
        expiry: agent?.licenceExpiryDate || '',
        company: agent?.insuranceCompany || '',
        eoNumber: agent?.eoPolicyNumber || '',
        eoCompany: agent?.eoPolicyCompany || '',
        eoExpiry: agent?.eoPolicyExpiryDate || '',
      },
    },
    taxDocuments: savedTaxDocuments,

    documents: [
      { name: 'Licence Application — ON.pdf', category: 'Licence', size: '1.2 MB', date: 'Jan 15, 2024', version: 'v3', status: 'Verified' },
      { name: 'E&O Policy Certificate 2024.pdf', category: 'E&O', size: '845 KB', date: 'Mar 1, 2024', version: 'v1', status: 'Verified' },
      { name: 'APEXA Profile Document.pdf', category: 'APEXA', size: '2.1 MB', date: 'Jan 15, 2024', version: 'v2', status: 'Verified' },
      { name: 'Credit Report — Equifax.pdf', category: 'Financial', size: '560 KB', date: 'Jan 10, 2024', version: 'v1', status: 'Verified' },
      { name: 'CFP Certificate.pdf', category: 'Certification', size: '320 KB', date: 'Jan 2020', version: 'v1', status: 'Verified' },
      { name: 'Government ID — Passport.jpg', category: 'Identity', size: '1.8 MB', date: 'Jan 12, 2024', version: 'v1', status: 'Verified' },
    ],

    activityLog: [
      { type: 'profile', action: 'CHS Designation submitted for approval', by: 'Mike Johnson', time: 'May 28, 2026 — 10:14 AM', badge: 'Pending Approval', badgeColor: 'yellow' },
      { type: 'delegation', action: 'Quote generated for Rajesh Sharma on behalf of agent', by: 'Admin John', time: 'May 15, 2026 — 2:34 PM', badge: 'Delegation', badgeColor: 'orange' },
      { type: 'delegation', action: 'Client record updated: Priya Patel', by: 'Admin John', time: 'May 15, 2026 — 2:30 PM', badge: 'Delegation', badgeColor: 'orange' },
      { type: 'login', action: 'Agent logged in', by: 'Mike Johnson', time: 'May 12, 2026 — 9:43 AM', badge: null },
      { type: 'profile', action: 'LinkedIn URL updated', by: 'Mike Johnson', time: 'May 10, 2026 — 3:12 PM', badge: null },
      { type: 'licence', action: 'NorthStar Mutual carrier authorization added', by: 'Admin John', time: 'Apr 30, 2026 — 11:00 AM', badge: 'Admin Action', badgeColor: 'blue' },
      { type: 'licence', action: 'Province AB added to agent licensing', by: 'Admin John', time: 'Mar 1, 2025 — 9:00 AM', badge: 'Admin Action', badgeColor: 'blue' },
      { type: 'system', action: 'BC License Expiry Warning email sent to agent', by: 'System', time: 'Oct 01, 2024 — 9:00 AM', badge: 'Auto', badgeColor: 'slate' },
      { type: 'login', action: 'Agent logged in', by: 'Mike Johnson', time: 'Feb 28, 2025 — 8:55 AM', badge: null },
      { type: 'profile', action: 'Profile photo updated', by: 'Mike Johnson', time: 'Feb 10, 2025 — 4:22 PM', badge: null },
    ],

    settings: {
      tier: subscriptionTier,
      notifications: settingsBlock.notifications || {},
      timezone: settingsBlock.timezone || '',
      username: agent?.email || '',
      status: agent?.lifecycleStatus ? toTitleCase(agent.lifecycleStatus) : agent?.accountActivationStatus === 1 ? 'Active' : agent?.status || 'Invited',
      createdAt: agent?.createdAt ? new Date(agent.createdAt).toLocaleDateString() : 'N/A',
    },
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function applyDynamicProfileData(data, agent) {
  const savedProfile = agent?.documents?.profile || {}
  const personal = savedProfile.personal || {}
  const professional = savedProfile.professional || {}
  const business = savedProfile.business || {}
  const online = savedProfile.online || {}
  const relationships = savedProfile.relationships || {}
  const socials = business.socials || business.social || {}
  const licenceDetails = parseLicenceDetails(professional.licenceDetails)
  const emergency = deriveEmergency(personal, relationships)
  const pick = (...vals) => vals.find((v) => v) || ''

  data.profile.professional.certifications = normalizeList(business.certifications || professional.certifications)
  data.profile.professional.awards = normalizeList((business.awards?.length ? business.awards : null) || professional.awards)
  data.profile.business.businessName = business.operatingName || business.businessName || agent?.insuranceCompany || ''
  data.profile.business.businessAddress = business.mailingAddress || business.businessAddress || personal.businessAddress || formatAddressLine(personal.address) || ''
  data.profile.business.website = online.website || socials.website || business.website || ''
  data.profile.business.social = {
    linkedin: pick(online.linkedin, socials.linkedin),
    facebook: pick(online.facebook, socials.facebook),
    instagram: pick(online.instagram, socials.instagram),
    twitter: pick(online.twitter, socials.twitter),
    youtube: pick(online.youtube, socials.youtube),
    tiktok: pick(online.tiktok, socials.tiktok),
    website: pick(online.website, socials.website, business.website),
    otherProfiles: pick(online.otherProfiles, socials.otherProfiles),
    bookingLink: pick(online.bookingLink, socials.bookingLink),
  }
  data.profile.personal.emergencyContact = emergency.contact
  data.profile.personal.emergencyPhone = emergency.phone
  data.profile.personal.emergencyRelation = emergency.relation
  data.profile.professional.licenceExpiry = professional.licenceExpiry || licenceDetails.expiry || ''

  return data
}

function val(v) {
  if (v === null || v === undefined || v === '') return 'N/A'
  if (typeof v === 'object') return Array.isArray(v) ? v.join(', ') || 'N/A' : (v.name || v.label || JSON.stringify(v))
  return v
}

const uploadedDocumentMeta = {
  governmentId: { label: 'Government ID', category: 'Identity' },
  licenceDocument: { label: 'Licence Document', category: 'Licence' },
  transferDocument: { label: 'Transfer / Licence Document', category: 'Licence' },
  eandODocument: { label: 'E&O Policy Certificate', category: 'E&O' },
  apexDocument: { label: 'APEXA Document', category: 'APEXA' },
  creditReportDocument: { label: 'Credit Report', category: 'Financial' },
  otherSupporting: { label: 'Other Supporting Document', category: 'Supporting' },
}

function formatFileSize(size) {
  const bytes = Number(size || 0)
  if (!bytes) return 'N/A'
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  return `${(bytes / 1024).toFixed(1)} KB`
}

function resolveUploadUrl(doc) {
  if (!doc?.path && !doc?.fileName) return ''
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000/api'
  const origin = apiBase.replace(/\/api\/?$/, '')
  if (doc.fileName) return `${origin}/uploads/agents/${doc.fileName}`
  const normalized = String(doc.path).replace(/\\/g, '/')
  const marker = '/uploads/'
  const uploadIndex = normalized.indexOf(marker)
  return uploadIndex >= 0 ? `${origin}${normalized.slice(uploadIndex)}` : ''
}

function buildUploadedDocuments(agent) {
  const documents = agent?.documents || {}
  const seen = new Set()
  return Object.entries(uploadedDocumentMeta)
    .map(([key, meta]) => {
      const doc = documents[key]
      if (!doc) return null
      // De-dupe the same physical file surfaced under multiple keys
      // (e.g. governmentId aliased to otherSupporting during registration).
      const fingerprint = doc.fileName || doc.path
      if (fingerprint && seen.has(fingerprint)) return null
      if (fingerprint) seen.add(fingerprint)
      return {
        id: key,
        type: meta.label,
        name: doc.originalName || doc.fileName || meta.label,
        category: meta.category,
        size: formatFileSize(doc.size),
        date: agent?.createdAt ? new Date(agent.createdAt).toLocaleDateString() : 'N/A',
        version: 'Uploaded',
        status: doc.adminReview?.action ? doc.adminReview.action.replace(/_/g, ' ') : 'Uploaded',
        url: resolveUploadUrl(doc),
      }
    })
    .filter(Boolean)
}

function formatActivityAction(action) {
  return String(action || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function mapAccountActivity(activity) {
  const apexaCompleted = Boolean(activity.details?.completed)
  // An action is "delegated" when an admin/master_admin performed it on the agent.
  const isDelegated =
    activity.details?.delegated === true ||
    activity.performedByType === 'admin' ||
    activity.performedByType === 'master_admin'
  const actorName =
    activity.details?.actorName ||
    (activity.performedByType === 'master_admin' ? 'Master Admin' : 'Admin')
  return {
    actionKey: activity.action,
    details: activity.details || null,
    type: isDelegated
      ? 'delegation'
      : activity.action?.includes('login')
        ? 'login'
        : activity.action?.includes('document')
          ? 'licence'
          : activity.action?.includes('profile')
            ? 'profile'
            : 'system',
    action: activity.title || formatActivityAction(activity.action),
    by: isDelegated
      ? actorName
      : activity.performedByType === activity.accountType && activity.performedById === activity.accountId
        ? 'Agent'
        : activity.performedByType || 'System',
    time: activity.performedAt ? new Date(activity.performedAt).toLocaleString() : '',
    performedAt: activity.performedAt || null,
    badge: isDelegated
      ? 'Admin Action'
      : activity.action === 'create_apexa_contract'
        ? apexaCompleted
          ? 'Completed'
          : 'Pending'
        : formatActivityAction(activity.action),
    badgeColor: isDelegated
      ? 'orange'
      : activity.action === 'create_apexa_contract'
        ? apexaCompleted
          ? 'green'
          : 'yellow'
        : activity.action?.includes('status')
          ? 'blue'
          : 'slate',
  }
}

function getLatestLoginTime(activities) {
  const latestLogin = [...activities]
    .filter(activity => String(activity.action || '').toLowerCase().includes('login') && activity.performedAt)
    .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime())[0]

  return latestLogin?.performedAt ? new Date(latestLogin.performedAt).toLocaleString() : ''
}

const TAB_COLORS = {
  profile: 'text-blue-600',
  delegation: 'text-orange-500',
  licence: 'text-violet-600',
  login: 'text-emerald-600',
  system: 'text-slate-500',
}

const ACTIVITY_DOTS = {
  profile: 'bg-blue-500',
  delegation: 'bg-orange-400',
  licence: 'bg-violet-500',
  login: 'bg-emerald-500',
  system: 'bg-slate-400',
}

// ─── Small UI components ──────────────────────────────────────────────────────

function Badge({ label, color = 'slate' }) {
  const map = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    gold: 'bg-amber-50 text-amber-600 border-amber-200',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${map[color] || map.slate}`}>
      {label}
    </span>
  )
}

function StatCard({ stat }) {
  const Icon = stat.icon
  const colorMap = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-500', val: 'text-blue-700' },
    green: { bg: 'bg-emerald-50', icon: 'text-emerald-500', val: 'text-emerald-700' },
    violet: { bg: 'bg-violet-50', icon: 'text-violet-500', val: 'text-violet-700' },
    sky: { bg: 'bg-sky-50', icon: 'text-sky-500', val: 'text-sky-700' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-500', val: 'text-emerald-700' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-500', val: 'text-amber-700' },
  }
  const c = colorMap[stat.color] || colorMap.blue
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.bg}`}>
          <Icon size={15} className={c.icon} />
        </div>
        {stat.deltaUp !== null && (
          <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${stat.deltaUp ? 'text-emerald-600' : 'text-red-500'}`}>
            {stat.deltaUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {stat.delta}
          </span>
        )}
      </div>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">{stat.label}</div>
      {stat.progress !== undefined ? (
        <>
          <div className="text-sm font-bold text-slate-800 mb-2">{stat.value}</div>
          <div className="h-1.5 w-full rounded-full bg-slate-100">
            <div className="h-1.5 rounded-full bg-amber-400 transition-all" style={{ width: `${stat.progress}%` }} />
          </div>
          <div className="mt-1 text-[11px] text-slate-400">{stat.delta}</div>
        </>
      ) : (
        <div className={`text-2xl font-bold ${c.val}`}>{stat.value}<span className="text-sm font-medium text-slate-400 ml-1">{stat.unit}</span></div>
      )}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value, warning }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 border border-slate-100">
      <Icon size={14} className={warning ? 'text-orange-400' : 'text-blue-500'} />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
        <div className={`text-sm font-semibold truncate ${warning ? 'text-orange-500' : 'text-slate-800'}`}>{val(value)}</div>
      </div>
    </div>
  )
}

function SectionCard({ title, children, action }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        {action && <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">{action}</button>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function FieldGrid({ children }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>
}

function FieldItem({ label, value, mono }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">{label}</div>
      <div className={`text-sm font-semibold text-slate-800 ${mono ? 'font-mono' : ''}`}>{val(value)}</div>
    </div>
  )
}

function Tag({ label, onRemove, color = 'blue' }) {
  const map = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${map[color]}`}>
      {label}
      {onRemove && <X size={10} className="cursor-pointer opacity-60 hover:opacity-100" onClick={onRemove} />}
    </span>
  )
}

// Read-only labelled list of pill tags (with an empty state).
function TagList({ label, items }) {
  const list = Array.isArray(items) ? items.filter(Boolean) : []
  return (
    <div className="mt-4">
      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">{label}</div>
      {list.length === 0 ? (
        <span className="text-xs text-slate-400">N/A</span>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {list.map((item, i) => <Tag key={`${item}-${i}`} label={item} color="slate" />)}
        </div>
      )}
    </div>
  )
}

// ─── Tab Contents ─────────────────────────────────────────────────────────────

function OverviewTab({ data, agent, onOpenMgaPackage, onCompleteApexaTask, completingApexaTask }) {
  const p = data.profile.personal
  const pr = data.profile.professional
  const latestApexaTask = [...(data.activityLog || [])]
    .filter((entry) => entry.actionKey === 'create_apexa_contract')
    .sort((a, b) => {
      const aActivation = a?.details?.step === 'activation' ? 1 : 0
      const bActivation = b?.details?.step === 'activation' ? 1 : 0
      if (aActivation !== bActivation) return bActivation - aActivation
      return new Date(b.performedAt || 0).getTime() - new Date(a.performedAt || 0).getTime()
    })[0] || null
  const apexaCompleted = Boolean(latestApexaTask?.details?.completed)
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
      <div className="space-y-5">
        <SectionCard title="Personal Information">
          <FieldGrid>
            <FieldItem label="Full Name" value={p.fullName} />
            <FieldItem label="Date of Birth" value={p.dob} />
            <FieldItem label="Personal Email" value={p.personalEmail} />
            <FieldItem label="Personal Phone" value={p.personalPhone} />
            <FieldItem label="Business Phone" value={p.businessPhone} />
            <FieldItem label="City" value={p.city} />
            <FieldItem label="Postal Code" value={p.postalCode} />
            <FieldItem label="Residence" value={p.residence} />
            <FieldItem label="Emergency Contact" value={p.emergencyContact} />
            <FieldItem label="Emergency Phone" value={p.emergencyPhone} />
            <FieldItem label="Emergency Relation" value={p.emergencyRelation} />
          </FieldGrid>
        </SectionCard>

        <SectionCard title="Professional Details">
          <FieldGrid>
            <FieldItem label="Licence No." value={pr.licenceNo} mono />
            <FieldItem label="Licence Type" value={pr.licenceType} />
            <FieldItem label="Licence Expiry" value={pr.licenceExpiry} />
            <FieldItem label="Insurance Company" value={pr.company} />
            <FieldItem label="Agent Code" value={pr.agentCode} mono />
            <FieldItem label="MGA" value={pr.mga} />
            <FieldItem label="Years Experience" value={pr.yearsExp ? `${pr.yearsExp} years` : ''} />
          </FieldGrid>
        </SectionCard>

        <SectionCard title="APEXA Workflow Task">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-slate-800">APEXA contract creation and approval</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">
                  {latestApexaTask
                    ? apexaCompleted
                      ? `Completed on ${new Date(latestApexaTask.details?.completedAt || latestApexaTask.performedAt).toLocaleString()}`
                      : 'Auto-created after agent activation for admin workflow tracking.'
                    : Number(agent?.accountActivationStatus) === 1
                      ? 'This workflow task should appear automatically after activation.'
                      : 'This workflow task will be created automatically when the agent is activated.'}
                </div>
              </div>
              <Badge
                label={
                  apexaCompleted
                    ? 'Completed'
                    : latestApexaTask
                      ? 'Pending'
                      : 'Not Created'
                }
                color={
                  apexaCompleted
                    ? 'green'
                    : latestApexaTask
                      ? 'yellow'
                      : 'slate'
                }
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onOpenMgaPackage}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Go to MGA Package
                <ChevronRight size={14} />
              </button>
              {latestApexaTask && !apexaCompleted && (
                <button
                  type="button"
                  onClick={() => onCompleteApexaTask(latestApexaTask)}
                  disabled={completingApexaTask}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {completingApexaTask ? 'Completing...' : 'Mark APEXA Task Completed'}
                </button>
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="space-y-5">
        <SectionCard title="Business Information">
          <FieldGrid>
            <FieldItem label="Business Name" value={data.profile.business.businessName} />
            <FieldItem label="Website" value={data.profile.business.website} />
          </FieldGrid>
          <div className="mt-4">
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">Areas of Expertise</div>
            <div className="flex flex-wrap gap-1.5">
              {p.expertise.map(e => <Tag key={e} label={e} color="slate" />)}
            </div>
          </div>
          <div className="mt-4">
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">Bio</div>
            <p className="text-sm text-slate-600 leading-relaxed">{p.bio}</p>
          </div>
        </SectionCard>

        <SectionCard title="Designations & Certifications">
          <div className="space-y-2.5">
            {pr.designations.map(d => (
              <div key={d.name} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3.5 py-2.5">
                <div>
                  <span className="text-sm font-bold text-slate-800">{d.name}</span>
                  <span className="ml-2 text-xs text-slate-500">{d.full}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">{d.date}</span>
                  <Badge label={d.status} color={d.status === 'Approved' ? 'green' : 'yellow'} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">Certifications</div>
            <ul className="space-y-1.5">
              {pr.certifications.map(c => (
                <li key={c} className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4">
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">Awards</div>
            <ul className="space-y-1.5">
              {pr.awards.map(a => (
                <li key={a} className="flex items-center gap-2 text-sm text-slate-700">
                  <Star size={13} className="text-amber-400 shrink-0" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

function PerformanceTab({ data, perf }) {
  const [noteText, setNoteText] = useState('')
  const p = perf || {}
  const fmt = (n) => (n === null || n === undefined ? '—' : String(n))
  const stats = [
    { label: 'Login Activity (30d)', value: fmt(p.loginCount30d ?? 0), unit: 'logins', delta: p.lastLogin ? `Last login ${new Date(p.lastLogin).toLocaleDateString()}` : 'No logins recorded', deltaUp: (p.loginCount30d || 0) > 0, icon: Activity, color: 'blue' },
    { label: 'Leads Assigned', value: fmt(p.leadsAssigned ?? 0), unit: '', delta: `${p.leadsConverted ?? 0} converted`, deltaUp: true, icon: Target, color: 'green' },
    { label: 'Conversion Rate', value: `${p.conversionRate ?? 0}%`, unit: '', delta: `${p.leadsConverted ?? 0} of ${p.leadsAssigned ?? 0} leads`, deltaUp: (p.conversionRate || 0) >= 15, icon: TrendingUp, color: 'violet' },
    { label: 'Quotes Generated', value: fmt(p.quotesGenerated ?? 0), unit: '', delta: 'Across assigned leads', deltaUp: true, icon: BarChart2, color: 'sky' },
    { label: 'Policies Sold', value: fmt(p.policiesSold ?? 0), unit: '', delta: `${p.clientsCount ?? 0} active clients`, deltaUp: true, icon: Award, color: 'emerald' },
    { label: 'Training Completed', value: '—', unit: '', delta: 'Not tracked yet', deltaUp: null, icon: BookOpen, color: 'amber' },
    { label: 'CE Credits', value: '—', unit: '', delta: 'Not tracked yet', deltaUp: null, icon: BookOpen, color: 'slate' },
  ]
  const alert = p.isInactive
    ? { title: 'Inactive Agent', body: 'No login activity recorded in the last 30 days. Consider reaching out to re-engage this agent.' }
    : null
  const notes = []
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <div className="space-y-5">
        {/* Inactivity alert (only when the agent is flagged inactive) */}
        {alert && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100">
              <AlertTriangle size={16} className="text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-700">{alert.title}</p>
              <p className="mt-1 text-xs text-red-600 leading-relaxed">{alert.body}</p>
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map(s => <StatCard key={s.label} stat={s} />)}
        </div>
        {!perf && (
          <p className="text-xs text-slate-400">Live metrics unavailable — showing zeros. Login, leads, quotes, clients and policies are computed from real activity; training and CE credits are not tracked yet.</p>
        )}

        {/* Trend chart placeholder */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Monthly Performance Trend</h3>
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1">
              {['Daily', 'Monthly'].map(v => (
                <button key={v} className={`rounded-md px-3 py-1 text-xs font-semibold transition ${v === 'Monthly' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>{v}</button>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-4">Illustrative trend — historical time-series charting coming soon.</p>
          {/* SVG mini chart */}
          <svg viewBox="0 0 600 120" className="w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 1, 2, 3, 4].map(i => <line key={i} x1="0" y1={20 + i * 20} x2="600" y2={20 + i * 20} stroke="#F1F5F9" strokeWidth="1" />)}
            {/* Leads line */}
            <polyline fill="url(#g1)" points="0,100 100,70 200,55 300,40 400,35 500,30 600,25 600,120 0,120" opacity="0.6" />
            <polyline fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points="0,100 100,70 200,55 300,40 400,35 500,30 600,25" />
            {/* Conversion line */}
            <polyline fill="url(#g2)" points="0,90 100,85 200,75 300,70 400,65 500,60 600,55 600,120 0,120" opacity="0.6" />
            <polyline fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points="0,90 100,85 200,75 300,70 400,65 500,60 600,55" />
          </svg>
          <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-4 rounded bg-blue-500" />Leads Assigned</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-4 rounded bg-emerald-500" />Conversion Rate</span>
          </div>
        </div>
      </div>

      {/* Notes panel */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col">
        <div className="border-b border-slate-100 px-5 py-3.5">
          <h3 className="text-sm font-bold text-slate-800">Operational Notes</h3>
          <p className="text-xs text-slate-400 mt-0.5">Internal records and performance feedback.</p>
        </div>
        <div className="p-4 border-b border-slate-100">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">Add New Note</p>
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none"
            rows={3}
            placeholder="Log compliance update, behavior note, or performance feedback..."
          />
          <div className="mt-2 flex items-center justify-between">
            <div className="flex gap-2 text-slate-400">
              <button className="hover:text-slate-600"><Paperclip size={15} /></button>
              <button className="hover:text-slate-600"><Flag size={15} /></button>
            </div>
            <button className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700">Save Note</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {notes.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-400">No operational notes yet.</div>
          )}
          {notes.map((n, i) => (
            <div key={i} className="p-4">
              <div className="flex items-start gap-2.5">
                <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${n.type === 'system' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                  {n.type === 'system' ? '⚡' : n.author.split(' ').map(p => p[0]).join('').slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-700">{n.author}</span>
                    <span className="text-[10px] text-slate-400">{n.time}</span>
                  </div>
                  {n.title && <p className="mt-1 text-xs font-semibold text-orange-600">{n.title}</p>}
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">{n.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ProfileTab({ data, section }) {
  const [sub, setSub] = useState('personal')
  const activeSub = section || sub
  const p = data.profile.personal
  const pr = data.profile.professional
  const b = data.profile.business
  const fam = data.profile.family || []
  const addr = p.address || {}
  const subTabs = ['Personal', 'Business', 'Credentials', 'Social Media', 'Documents']
  return (
    <div>
      {/* Sub-tab bar (hidden when this tab is driven by a top-level section) */}
      {!section && (
        <div className="mb-5 flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
          {subTabs.map(t => (
            <button
              key={t}
              onClick={() => setSub(t.toLowerCase().replace(' ', '-'))}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${sub === t.toLowerCase().replace(' ', '-') ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {activeSub === 'personal' && (
        <div className="grid gap-5 lg:grid-cols-[200px_1fr]">
          <div className="flex flex-col items-center gap-3">
            <div
              className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-2xl font-bold text-white"
              style={data.avatarUrl ? { backgroundImage: `url(${data.avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
            >
              {!data.avatarUrl && data.initials}
            </div>
            <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">Upload Photo</button>
            <div className="h-12 w-12 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 cursor-pointer hover:border-blue-400">
              <Building2 size={16} />
            </div>
            <p className="text-[10px] text-slate-400">Upload Logo</p>
            {/* Completion */}
            <div className="w-full rounded-xl border border-slate-200 bg-white p-3 mt-2">
              <div className="flex justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-500">Profile Complete</span>
                <span className="text-[10px] font-bold text-blue-600">72%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100">
                <div className="h-1.5 rounded-full bg-blue-500" style={{ width: '72%' }} />
              </div>
              <p className="mt-2 text-[10px] text-orange-500">Missing: Logo, TikTok, Awards</p>
            </div>
          </div>
          <div className="space-y-5">
            <SectionCard title="Personal Information">
              <FieldGrid>
                <FieldItem label="First Name" value={p.firstName || p.fullName} />
                <FieldItem label="Last Name" value={p.lastName} />
                <FieldItem label="Preferred Name" value={p.preferredName} />
                <FieldItem label="Date of Birth" value={p.dob} />
                <FieldItem label="Gender" value={p.gender} />
                <FieldItem label="Marital Status" value={p.maritalStatus} />
              </FieldGrid>
            </SectionCard>
            <SectionCard title="Contact Information">
              <FieldGrid>
                <FieldItem label="Personal Email" value={p.personalEmail} />
                <FieldItem label="Primary Phone" value={p.personalPhone} />
                <FieldItem label="Secondary Phone" value={p.secondaryPhone} />
                <FieldItem label="Business Phone" value={p.businessPhone} />
              </FieldGrid>
            </SectionCard>
            <SectionCard title="Residential Address">
              <FieldGrid>
                <FieldItem label="Unit" value={addr.unit} />
                <FieldItem label="Street Number" value={addr.streetNumber} />
                <FieldItem label="Street Name" value={addr.streetName} />
                <FieldItem label="City" value={addr.city} />
                <FieldItem label="Province" value={addr.province} />
                <FieldItem label="Postal Code" value={addr.postalCode} />
                <FieldItem label="Country" value={addr.country} />
                <FieldItem label="Residence Type" value={p.residence} />
              </FieldGrid>
            </SectionCard>
            <SectionCard title="Emergency Contact Information">
              <FieldGrid>
                <FieldItem label="Emergency Contact" value={p.emergencyContact} />
                <FieldItem label="Emergency Phone" value={p.emergencyPhone} />
                <FieldItem label="Emergency Relation" value={p.emergencyRelation} />
              </FieldGrid>
            </SectionCard>
            <SectionCard title={`Family Information${fam.length ? ` · ${fam.length}` : ''}`}>
              {fam.length === 0 ? (
                <p className="text-sm text-slate-400">No family members added.</p>
              ) : (
                <div className="space-y-3">
                  {fam.map((m, i) => (
                    <div key={i} className="rounded-xl border border-slate-200 p-3.5">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-sm font-bold text-slate-800">
                          {[m.firstName, m.lastName].filter(Boolean).join(' ') || 'Family member'}
                        </span>
                        {m.relationship && <Badge label={m.relationship} color="blue" />}
                      </div>
                      <FieldGrid>
                        <FieldItem label="Preferred Name" value={m.preferredName} />
                        <FieldItem label="Date of Birth" value={formatDateValue(m.dob)} />
                        <FieldItem label="Gender" value={m.gender} />
                        <FieldItem label="Phone" value={m.phone} />
                        <FieldItem label="Email" value={m.email} />
                        <FieldItem label="Occupation" value={m.occupation} />
                      </FieldGrid>
                      {m.notes && <p className="mt-2 text-xs text-slate-500">{m.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      )}

      {activeSub === 'business' && (
        <SectionCard title="Business Profile">
          <FieldGrid>
            <FieldItem label="Business / Operating Name" value={b.operatingName || b.businessName} />
            <FieldItem label="Business Address" value={b.businessAddress} />
            <FieldItem label="Mailing Address" value={b.mailingAddress} />
            <FieldItem label="Business Phone" value={b.businessPhone} />
            <FieldItem label="Business Email" value={b.businessEmail} />
            <FieldItem label="Website" value={b.website} />
            <FieldItem label="Years of Experience" value={b.yearsExperience ? `${b.yearsExperience} years` : ''} />
          </FieldGrid>
          <div className="mt-4">
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Professional Bio</div>
            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100">{p.bio || 'N/A'}</p>
          </div>
          <TagList label="Areas of Specialization" items={b.specializations} />
          <TagList label="Insurance Products Offered" items={b.products} />
          <TagList label="Service Areas / Provinces" items={b.serviceAreas} />
          <TagList label="Languages Spoken" items={b.languages} />
          <TagList label="Professional Designations" items={(pr.designations || []).map((d) => d.name || d).filter(Boolean)} />
          <TagList label="Awards & Achievements" items={pr.awards} />
        </SectionCard>
      )}

      {activeSub === 'credentials' && (
        <div className="space-y-5">
          <SectionCard title="Licence Information">
            <div className="flex items-center gap-2 mb-3 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
              <Lock size={13} className="text-slate-400" />
              <span className="text-xs text-slate-500">Managed by Admin — contact admin to update licence details</span>
            </div>
            <FieldGrid>
              <FieldItem label="Licence Number" value={pr.licenceNo} mono />
              <FieldItem label="Licence Type" value={pr.licenceType} />
              <FieldItem label="Expiry Date" value={pr.licenceExpiry} />
              <FieldItem label="Insurance Company" value={pr.company} />
            </FieldGrid>
          </SectionCard>
          <SectionCard title="Designations" action="+ Add Designation">
            <div className="space-y-2.5">
              {pr.designations.map(d => (
                <div key={d.name} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                  <div>
                    <span className="text-sm font-bold text-slate-800">{d.name}</span>
                    <span className="ml-2 text-xs text-slate-500">{d.full}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Since {d.date}</span>
                    <Badge label={d.status} color={d.status === 'Approved' ? 'green' : 'yellow'} />
                    <button className="text-slate-300 hover:text-red-400"><X size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Certifications & Awards" action="+ Add">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">Certifications</div>
                <ul className="space-y-2">
                  {pr.certifications.map(c => (
                    <li key={c} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />{c}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">Awards</div>
                <ul className="space-y-2">
                  {pr.awards.map(a => (
                    <li key={a} className="flex items-center gap-2 text-sm text-slate-700">
                      <Star size={13} className="text-amber-400 shrink-0" />{a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {activeSub === 'social-media' && (
        <SectionCard title="Social Media & Online Presence">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: 'LinkedIn', key: 'linkedin', Icon: Linkedin, color: 'text-blue-700' },
              { label: 'Facebook', key: 'facebook', Icon: Globe, color: 'text-blue-600' },
              { label: 'Instagram', key: 'instagram', Icon: Instagram, color: 'text-pink-500' },
              { label: 'Twitter / X', key: 'twitter', Icon: Twitter, color: 'text-sky-500' },
              { label: 'YouTube', key: 'youtube', Icon: Youtube, color: 'text-red-500' },
              { label: 'TikTok', key: 'tiktok', Icon: Globe, color: 'text-slate-700' },
              { label: 'Website', key: 'website', Icon: Globe, color: 'text-slate-500' },
              { label: 'Other Profile', key: 'otherProfiles', Icon: Globe, color: 'text-indigo-500' },
              { label: 'Booking / Calendar', key: 'bookingLink', Icon: Calendar, color: 'text-amber-500' },
            ].map(({ label, key, Icon: Ic, color }) => (
              <div key={key}>
                <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 block mb-1.5">{label}</label>
                <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-white overflow-hidden">
                  <div className="flex h-full w-10 items-center justify-center border-r border-slate-100 bg-slate-50">
                    <Ic size={14} className={color} />
                  </div>
                  <input
                    defaultValue={b.social[key] || ''}
                    placeholder={`https://${label.toLowerCase().replace(' / ', '').replace(' ', '')}.com/yourprofile`}
                    className="flex-1 px-3 text-sm text-slate-700 placeholder:text-slate-300 outline-none bg-transparent"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-end">
            <button className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700">Save Changes</button>
          </div>
        </SectionCard>
      )}

      {activeSub === 'documents' && <DocumentsTabContent data={data} />}
    </div>
  )
}

function DocumentsTabContent({ data }) {
  const toast = useToast()
  const catColors = { Licence: 'blue', 'E&O': 'violet', APEXA: 'sky', Financial: 'emerald', Identity: 'amber', Supporting: 'slate' }

  const notImplemented = () => toast.info('Document view & download is under implementation.')

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">{data.documents.length} documents on file</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-2.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
          <span>Document</span><span>Category</span><span>Size</span><span>Date</span><span>Actions</span>
        </div>
        <div className="divide-y divide-slate-100">
          {data.documents.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">
              No uploaded documents found for this agent.
            </div>
          ) : data.documents.map((doc, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 border border-red-100">
                  <FileText size={14} className="text-red-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{doc.type || doc.name}</p>
                  {doc.type && doc.name !== doc.type && (
                    <p className="text-xs text-slate-500 truncate">{doc.name}</p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge label={doc.version} color="blue" />
                    <Badge label={doc.status} color="green" />
                  </div>
                </div>
              </div>
              <Badge label={doc.category} color={catColors[doc.category] || 'slate'} />
              <span className="text-xs text-slate-500">{doc.size}</span>
              <span className="text-xs text-slate-500">{doc.date}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={notImplemented}
                  title="View document"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Eye size={13} />
                </button>
                <button
                  type="button"
                  onClick={notImplemented}
                  title="Download document"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Download size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function renewalStatus(expiry) {
  if (!expiry) return { label: 'Not set', color: 'slate' }
  const d = new Date(expiry)
  if (Number.isNaN(d.getTime())) return { label: 'Not set', color: 'slate' }
  const days = Math.ceil((d.getTime() - Date.now()) / 86400000)
  if (days < 0) return { label: 'Expired', color: 'red' }
  if (days <= 60) return { label: `Expiring in ${days}d`, color: 'orange' }
  return { label: 'Valid', color: 'green' }
}

const licClone = (v) => JSON.parse(JSON.stringify(v || null))
const tinyInput = 'w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100'

function LicensingTab({ data, agentId, onUpdated }) {
  const toast = useToast()
  const lic = data.licensing
  const licence = lic.licence || {}
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState(null)

  const startEdit = () => {
    setDraft({
      provinces: licClone(lic.provinces) || [],
      carriers: licClone(lic.carriers) || [],
      ceCredits: licClone(lic.ceCredits) || [],
      renewal: licClone(lic.renewal) || {},
    })
    setEditing(true)
  }
  const cancel = () => { setEditing(false); setDraft(null) }
  const save = async () => {
    if (!agentId) return
    setSaving(true)
    try {
      await updateAgentLicensing(agentId, draft)
      toast.success('Licensing details updated.')
      setEditing(false); setDraft(null)
      onUpdated && onUpdated(false)
    } catch (e) {
      toast.error(e.message || 'Unable to update licensing.')
    } finally { setSaving(false) }
  }

  const v = editing ? draft : { provinces: lic.provinces, carriers: lic.carriers, ceCredits: lic.ceCredits, renewal: lic.renewal }
  const setArr = (key, next) => setDraft((d) => ({ ...d, [key]: typeof next === 'function' ? next(d[key] || []) : next }))
  const setRenewal = (patch) => setDraft((d) => ({ ...d, renewal: { ...(d.renewal || {}), ...patch } }))
  const totalCE = (v.ceCredits || []).reduce((s, c) => s + (Number(c.credits) || 0), 0)
  const licRenewal = renewalStatus((v.renewal && v.renewal.licenceExpiry) || licence.expiry)
  const eoRenewal = renewalStatus((v.renewal && v.renewal.eoExpiry) || licence.eoExpiry)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Licence details come from onboarding (read-only). Provinces, carriers, CE credits & renewals are admin-managed.</p>
        {!editing ? (
          <button type="button" onClick={startEdit} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">Manage</button>
        ) : (
          <div className="flex gap-2">
            <button type="button" onClick={cancel} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Discard</button>
            <button type="button" onClick={save} disabled={saving} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:bg-emerald-300">{saving ? 'Saving…' : 'Save'}</button>
          </div>
        )}
      </div>

      {/* Licence Information — populated from onboarding, non-editable */}
      <SectionCard title="Licence Information (from onboarding)">
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <Lock size={13} className="text-slate-400" />
          <span className="text-xs text-slate-500">Read-only — captured during agent registration/onboarding.</span>
        </div>
        <FieldGrid>
          <FieldItem label="Licence Number" value={licence.number} mono />
          <FieldItem label="Licence Type" value={licence.type} />
          <FieldItem label="Insurance Company" value={licence.company} />
          <FieldItem label="E&O Policy Number" value={licence.eoNumber} />
          <FieldItem label="E&O Company" value={licence.eoCompany} />
        </FieldGrid>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Licence Renewal</span>
              <Badge label={licRenewal.label} color={licRenewal.color} />
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-800">{formatDateValue(licence.expiry) || 'No expiry on file'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">E&amp;O Renewal</span>
              <Badge label={eoRenewal.label} color={eoRenewal.color} />
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-800">{formatDateValue(licence.eoExpiry) || 'No expiry on file'}</p>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Provinces */}
        <SectionCard title="Licensed Provinces / Territories">
          {(v.provinces || []).length === 0 && !editing && <p className="text-sm text-slate-400">No provinces assigned.</p>}
          <div className="space-y-2.5">
            {(v.provinces || []).map((p, i) => editing ? (
              <div key={i} className="grid grid-cols-[64px_1fr_1fr_auto] items-center gap-2 rounded-xl border border-slate-200 p-2">
                <input className={tinyInput} placeholder="ON" value={p.code || ''} onChange={(e) => setArr('provinces', (a) => a.map((x, j) => j === i ? { ...x, code: e.target.value.toUpperCase().slice(0, 3) } : x))} />
                <input className={tinyInput} placeholder="Province name" value={p.name || ''} onChange={(e) => setArr('provinces', (a) => a.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                <input type="date" className={tinyInput} value={p.expiry || ''} onChange={(e) => setArr('provinces', (a) => a.map((x, j) => j === i ? { ...x, expiry: e.target.value } : x))} />
                <button type="button" onClick={() => setArr('provinces', (a) => a.filter((_, j) => j !== i))} className="text-slate-300 hover:text-red-400"><X size={14} /></button>
              </div>
            ) : (
              <div key={i} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">{p.code || '—'}</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{p.name || p.code}</p>
                    <p className="text-[11px] text-slate-400">Expiry: {formatDateValue(p.expiry) || 'N/A'}</p>
                  </div>
                </div>
                <Badge label={renewalStatus(p.expiry).label} color={renewalStatus(p.expiry).color} />
              </div>
            ))}
          </div>
          {editing && (
            <button type="button" onClick={() => setArr('provinces', (a) => [...a, { code: '', name: '', expiry: '' }])} className="mt-3 inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50"><Plus size={12} /> Add Province</button>
          )}
        </SectionCard>

        {/* Carriers */}
        <SectionCard title="Carrier Authorization & Selling Codes">
          {(v.carriers || []).length === 0 && !editing && <p className="text-sm text-slate-400">No carrier authorizations.</p>}
          <div className="space-y-2.5">
            {(v.carriers || []).map((c, i) => editing ? (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 rounded-xl border border-slate-200 p-2">
                <input className={tinyInput} placeholder="Carrier name" value={c.name || ''} onChange={(e) => setArr('carriers', (a) => a.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                <input className={tinyInput} placeholder="Selling code" value={c.code || ''} onChange={(e) => setArr('carriers', (a) => a.map((x, j) => j === i ? { ...x, code: e.target.value } : x))} />
                <button type="button" onClick={() => setArr('carriers', (a) => a.filter((_, j) => j !== i))} className="text-slate-300 hover:text-red-400"><X size={14} /></button>
              </div>
            ) : (
              <div key={i} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{c.name || 'Carrier'}</p>
                  <p className="text-[11px] text-slate-400">Selling code: <span className="font-mono">{c.code || '—'}</span></p>
                </div>
                <Badge label={c.code ? 'Authorized' : 'Not Authorized'} color={c.code ? 'green' : 'slate'} />
              </div>
            ))}
          </div>
          {editing && (
            <button type="button" onClick={() => setArr('carriers', (a) => [...a, { name: '', code: '' }])} className="mt-3 inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50"><Plus size={12} /> Add Carrier</button>
          )}
        </SectionCard>
      </div>

      {/* CE Credits */}
      <SectionCard title={`Continuing Education (CE) Credits · ${totalCE} total`}>
        {(v.ceCredits || []).length === 0 && !editing && <p className="text-sm text-slate-400">No CE credits recorded.</p>}
        <div className="space-y-2.5">
          {(v.ceCredits || []).map((c, i) => editing ? (
            <div key={i} className="grid grid-cols-[1fr_1fr_80px_1fr_auto] items-center gap-2 rounded-xl border border-slate-200 p-2">
              <input className={tinyInput} placeholder="Course" value={c.course || ''} onChange={(e) => setArr('ceCredits', (a) => a.map((x, j) => j === i ? { ...x, course: e.target.value } : x))} />
              <input className={tinyInput} placeholder="Provider" value={c.provider || ''} onChange={(e) => setArr('ceCredits', (a) => a.map((x, j) => j === i ? { ...x, provider: e.target.value } : x))} />
              <input type="number" min="0" className={tinyInput} placeholder="Credits" value={c.credits ?? ''} onChange={(e) => setArr('ceCredits', (a) => a.map((x, j) => j === i ? { ...x, credits: e.target.value } : x))} />
              <input type="date" className={tinyInput} value={c.date || ''} onChange={(e) => setArr('ceCredits', (a) => a.map((x, j) => j === i ? { ...x, date: e.target.value } : x))} />
              <button type="button" onClick={() => setArr('ceCredits', (a) => a.filter((_, j) => j !== i))} className="text-slate-300 hover:text-red-400"><X size={14} /></button>
            </div>
          ) : (
            <div key={i} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">{c.course || 'CE course'}</p>
                <p className="text-[11px] text-slate-400">{c.provider || '—'} · {formatDateValue(c.date) || 'N/A'}</p>
              </div>
              <Badge label={`${Number(c.credits) || 0} credits`} color="blue" />
            </div>
          ))}
        </div>
        {editing && (
          <button type="button" onClick={() => setArr('ceCredits', (a) => [...a, { course: '', provider: '', credits: '', date: '' }])} className="mt-3 inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50"><Plus size={12} /> Add CE Credit</button>
        )}
      </SectionCard>
    </div>
  )
}

function TaxDocumentsTab({ data, agentId, onUpdated }) {
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState(null)
  const list = editing ? draft : (data.taxDocuments || [])

  const startEdit = () => { setDraft(licClone(data.taxDocuments) || []); setEditing(true) }
  const cancel = () => { setEditing(false); setDraft(null) }
  const save = async () => {
    if (!agentId) return
    setSaving(true)
    try {
      await updateAgentTaxDocuments(agentId, draft)
      toast.success('Tax documents updated.')
      setEditing(false); setDraft(null)
      onUpdated && onUpdated(false)
    } catch (e) {
      toast.error(e.message || 'Unable to update tax documents.')
    } finally { setSaving(false) }
  }
  const setRow = (i, patch) => setDraft((a) => a.map((x, j) => j === i ? { ...x, ...patch } : x))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{(data.taxDocuments || []).length} tax document record(s). File upload &amp; view are under implementation.</p>
        {!editing ? (
          <button type="button" onClick={startEdit} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">Manage</button>
        ) : (
          <div className="flex gap-2">
            <button type="button" onClick={cancel} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Discard</button>
            <button type="button" onClick={save} disabled={saving} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:bg-emerald-300">{saving ? 'Saving…' : 'Save'}</button>
          </div>
        )}
      </div>

      <SectionCard title="Tax Document Repository">
        {list.length === 0 && !editing && <p className="text-sm text-slate-400">No tax documents on record.</p>}
        <div className="space-y-2.5">
          {list.map((t, i) => editing ? (
            <div key={i} className="grid grid-cols-[1fr_100px_1fr_1fr_auto] items-center gap-2 rounded-xl border border-slate-200 p-2">
              <input className={tinyInput} placeholder="Type (e.g. T4A)" value={t.type || ''} onChange={(e) => setRow(i, { type: e.target.value })} />
              <input className={tinyInput} placeholder="Year" value={t.year || ''} onChange={(e) => setRow(i, { year: e.target.value })} />
              <select className={tinyInput} value={t.status || 'Pending'} onChange={(e) => setRow(i, { status: e.target.value })}>
                <option>Pending</option><option>Received</option><option>Filed</option>
              </select>
              <input className={tinyInput} placeholder="Notes" value={t.notes || ''} onChange={(e) => setRow(i, { notes: e.target.value })} />
              <button type="button" onClick={() => setDraft((a) => a.filter((_, j) => j !== i))} className="text-slate-300 hover:text-red-400"><X size={14} /></button>
            </div>
          ) : (
            <div key={i} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-100"><FileText size={14} className="text-emerald-600" /></div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{t.type || 'Tax document'} {t.year ? `· ${t.year}` : ''}</p>
                  {t.notes && <p className="text-[11px] text-slate-400">{t.notes}</p>}
                </div>
              </div>
              <Badge label={t.status || 'Pending'} color={t.status === 'Filed' ? 'green' : t.status === 'Received' ? 'blue' : 'slate'} />
            </div>
          ))}
        </div>
        {editing && (
          <button type="button" onClick={() => setDraft((a) => [...(a || []), { type: '', year: '', status: 'Pending', notes: '' }])} className="mt-3 inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50"><Plus size={12} /> Add Tax Document</button>
        )}
      </SectionCard>
    </div>
  )
}

function ActivityLogTab({ data }) {
  const [filter, setFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const filters = ['all', 'profile', 'delegation', 'licence', 'login', 'system']
  const filtered = data.activityLog.filter((entry) => {
    if (filter !== 'all' && entry.type !== filter) return false

    if (!dateFrom && !dateTo) return true
    if (!entry.performedAt) return false

    const entryTime = new Date(entry.performedAt).getTime()
    const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null
    const toTime = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null

    if (fromTime !== null && entryTime < fromTime) return false
    if (toTime !== null && entryTime > toTime) return false
    return true
  })
  return (
    <div>
      <div className="mb-5 flex items-center gap-2 flex-wrap">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize transition ${filter === f ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 bg-white'}`}
          >
            {f === 'all' ? `All (${data.activityLog.length})` : f}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          {(dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => {
                setDateFrom('')
                setDateTo('')
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-2.5 flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {filtered.length} entries
          </span>
          <span className="ml-2 text-[10px] text-orange-500 font-semibold">
            🟠 Orange entries = Delegation actions by Admin
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {filtered.map((entry, i) => (
            <div key={i} className={`flex items-start gap-4 px-5 py-4 transition-colors hover:bg-slate-50 ${entry.type === 'delegation' ? 'bg-orange-50/40' : ''}`}>
              <div className="mt-1 shrink-0">
                <div className={`h-2.5 w-2.5 rounded-full ${ACTIVITY_DOTS[entry.type] || 'bg-slate-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{entry.action}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      By: <span className="font-semibold text-slate-600">{entry.by}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {entry.badge && <Badge label={entry.badge} color={entry.badgeColor || 'slate'} />}
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">{entry.time}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-400">No activity found for this filter.</div>
        )}
      </div>
    </div>
  )
}

function DocumentsTab({ data }) {
  return <DocumentsTabContent data={data} />
}

const SUBSCRIPTIONS = [
  {
    name: 'Silver',
    icon: '🥈',
    description: 'Standard agent profile badge and basic marketing access.',
    color: 'border-slate-300 bg-slate-50 text-slate-700',
  },
  {
    name: 'Gold',
    icon: '🥇',
    description: 'Gold badge with expanded marketing templates and visibility.',
    color: 'border-amber-300 bg-amber-50 text-amber-700',
  },
  {
    name: 'Platinum',
    icon: '💎',
    description: 'Premium badge with full profile benefits and priority visibility.',
    color: 'border-violet-300 bg-violet-50 text-violet-700',
  },
]

function SettingsTab({ data, onSubscriptionChange, onStatusChange, statusSaving }) {
  const s = data.settings
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <SectionCard title="Account Settings">
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Account Status</p>
              <p className="text-xs text-slate-400">Current status of this agent account</p>
            </div>
            <select
              value={s.status}
              disabled={statusSaving}
              onChange={(e) => onStatusChange?.(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            >
              {['Prospect', 'Onboarding', 'Active', 'Inactive', 'Suspended', 'Terminated'].map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Subscription">
        <div className="grid gap-3 sm:grid-cols-3">
          {SUBSCRIPTIONS.map(subscription => {
            const active = s.tier === subscription.name
            return (
              <button
                key={subscription.name}
                type="button"
                onClick={() => onSubscriptionChange(subscription.name)}
                className={`rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
                  active ? `${subscription.color} ring-2 ring-blue-100` : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200'
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xl">{subscription.icon}</span>
                  {active && <Badge label="Active" color="blue" />}
                </div>
                <p className="text-sm font-bold">{subscription.name}</p>
                <p className="mt-1 text-xs leading-relaxed opacity-75">{subscription.description}</p>
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          This subscription controls the badge shown on the agent profile.
        </p>
      </SectionCard>

      <SectionCard title="Notification Preferences">
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Email Notifications</p>
              <p className="text-xs text-slate-400">Receive alerts via email</p>
            </div>
            <div className={`relative h-5 w-9 rounded-full cursor-pointer transition ${s.notifications.email ? 'bg-blue-500' : 'bg-slate-300'}`}>
              <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${s.notifications.email ? 'left-[18px]' : 'left-0.5'}`} />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Account Info">
        <FieldGrid>
          <FieldItem label="Account Created" value={s.createdAt} />
          <FieldItem label="Last Password Change" value={s.lastPasswordChange} />
        </FieldGrid>
        <div className="mt-4 flex gap-2">
          <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Reset Password
          </button>
          <button className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
            Deactivate Account
          </button>
        </div>
      </SectionCard>
    </div>
  )
}

// Read-only mirror of the agent's System Settings section.
function SystemSettingsInfoTab({ data, agent }) {
  const s = data.settings || {}
  const n = s.notifications || {}
  const yn = (v) => (v ? 'On' : 'Off')
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <SectionCard title="Notification Preferences">
        <FieldGrid>
          <FieldItem label="Email Notifications" value={yn(n.email?.enabled)} />
          <FieldItem label="SMS Notifications" value={yn(n.sms?.enabled)} />
          <FieldItem label="WhatsApp Notifications" value={yn(n.whatsapp?.enabled)} />
          <FieldItem label="Time Zone" value={s.timezone} />
        </FieldGrid>
        {n.email?.enabled && (
          <div className="mt-2">
            <FieldGrid>
              <FieldItem label="Transactional Emails" value={yn(n.email?.transactional)} />
              <FieldItem label="Marketing Emails" value={yn(n.email?.marketing)} />
            </FieldGrid>
          </div>
        )}
      </SectionCard>
      <SectionCard title="Security & Login">
        <FieldGrid>
          <FieldItem label="Username" value={s.username || agent?.email} />
          <FieldItem label="Account Status" value={s.status} />
          <FieldItem label="Member Since" value={s.createdAt} />
          <FieldItem label="MFA" value="Not enabled" />
        </FieldGrid>
        <p className="mt-3 text-xs text-slate-400">Login &amp; device history appear in the Activity Log tab.</p>
      </SectionCard>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AgentProfileView() {
  const { agentId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [agent, setAgent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [mockData, setMockData] = useState(null)
  const [completingApexaTask, setCompletingApexaTask] = useState(false)
  const [decidingTier, setDecidingTier] = useState(false)
  const [perf, setPerf] = useState(null)
  const [actingOnBehalf, setActingOnBehalf] = useState(false)
  const [statusSaving, setStatusSaving] = useState(false)

  async function loadAgentProfile(isMounted = () => true) {
    setLoading(true)
    setError('')
    try {
      const [agentData, _profileData, activityData, perfData] = await Promise.all([
        getAgent(agentId),
        getAgentProfile(agentId),
        getAccountActivities('agent', agentId, { limit: 100 }).catch(() => ({ items: [] })),
        getAgentPerformance(agentId).catch(() => null),
      ])
      if (!isMounted()) return
      const nextData = applyDynamicProfileData(buildMockData(agentData), agentData)
      nextData.documents = buildUploadedDocuments(agentData)
      const activities = Array.isArray(activityData?.items) ? activityData.items : []
      const latestLoginTime = getLatestLoginTime(activities)
      nextData.lastLogin = latestLoginTime || nextData.lastLogin
      nextData.lastLoginWarning = !nextData.lastLogin
      nextData.activityLog = activities.map(mapAccountActivity)
      setAgent(agentData)
      setMockData(nextData)
      setPerf(perfData || null)
    } catch (err) {
      if (isMounted()) setError(err.message || 'Unable to load agent profile.')
    } finally {
      if (isMounted()) setLoading(false)
    }
  }

  useEffect(() => {
    if (!agentId) return
    let mounted = true
    loadAgentProfile(() => mounted)
    return () => { mounted = false }
  }, [agentId])

  const TABS = [
    { id: 'overview', label: 'Overview' },
    // Mirror of the agent's own profile sections
    { id: 'tier', label: 'Tier Level' },
    { id: 'personal', label: 'Personal Profile' },
    { id: 'business', label: 'Business Profile' },
    { id: 'online', label: 'Online Profile' },
    { id: 'system', label: 'System Settings' },
    // Admin-only tabs
    { id: 'performance', label: 'Performance' },
    { id: 'licensing', label: 'Licensing' },
    { id: 'documents', label: 'Documents' },
    { id: 'tax', label: 'Tax Documents' },
    { id: 'activity', label: 'Activity Log' },
  ]

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
        <p className="text-sm text-slate-500">Loading profile...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <AlertTriangle size={32} className="text-red-400 mx-auto mb-3" />
        <p className="text-sm text-red-600 font-semibold">{error}</p>
      </div>
    </div>
  )

  const d = mockData
  if (!d) return null

  const tierColors = { Silver: 'bg-slate-100 text-slate-600 border-slate-300', Gold: 'bg-amber-50 text-amber-600 border-amber-300', Platinum: 'bg-violet-50 text-violet-600 border-violet-300' }
  const tierRequest = agent?.documents?.tierRequest || null
  const pendingTierRequest = tierRequest && tierRequest.status === 'pending' ? tierRequest : null
  const handleTierDecision = async (decision) => {
    if (!agent?.id || decidingTier) return
    let note = ''
    if (decision === 'rejected') {
      const result = await confirmDialog({
        title: 'Decline upgrade request',
        message: 'Add an optional note for the agent (reason for declining).',
        confirmText: 'Decline',
        variant: 'danger',
        input: { placeholder: 'Reason (optional)…' },
      })
      if (result === null) return // cancelled
      note = result
    }
    setDecidingTier(true)
    try {
      const updated = await decideAgentTierRequest(agent.id, { decision, note: note || undefined })
      if (updated?.agent) {
        setAgent(updated.agent)
        if (decision === 'approved') {
          setMockData((prev) => (prev ? { ...prev, tier: updated.agent.subscriptionTier } : prev))
        }
      }
      toast.success(decision === 'approved' ? 'Tier upgrade approved.' : 'Tier upgrade declined.')
    } catch (err) {
      toast.error(err.message || 'Unable to update the tier request.')
    } finally {
      setDecidingTier(false)
    }
  }
  const handleActOnBehalf = async () => {
    if (!agent?.id || actingOnBehalf) return
    if (Number(agent?.accountActivationStatus) !== 1) {
      toast.error('This agent is not active yet, so you cannot act on their behalf.', 'Agent Must Be Active')
      return
    }
    const ok = await confirmDialog({
      title: 'Act on behalf of agent',
      message: `Act on behalf of ${agent?.name || 'this agent'}? You'll operate their portal until you choose to return. This is recorded in the audit log.`,
      confirmText: 'Act on Behalf',
    })
    if (!ok) return
    setActingOnBehalf(true)
    try {
      const data = await auth.impersonateAgent(agent.id)
      auth.startImpersonation(data)
      // Full reload so the whole app re-reads the agent session.
      window.location.href = '/agent/dashboard'
    } catch (err) {
      toast.error(err.message || 'Unable to start the delegation session.', 'Act on Behalf Unavailable')
      setActingOnBehalf(false)
    }
  }

  const handleSubscriptionChange = async (tier) => {
    setMockData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        tier,
        settings: {
          ...prev.settings,
          tier,
        },
      }
    })

    if (!agent?.id) return

    try {
      const currentProfile = agent?.documents?.profile || {}
      const nextProfile = {
        ...currentProfile,
        settings: {
          ...(currentProfile.settings || {}),
          subscriptionTier: tier,
        },
      }
      const formData = new FormData()
      formData.append('profile', JSON.stringify(nextProfile))
      const updated = await updateAgentProfile(agent.id, formData)
      setAgent(updated?.agent || {
        ...agent,
        documents: {
          ...(agent.documents || {}),
          profile: nextProfile,
        },
      })
    } catch (err) {
      toast.error(err.message || 'Unable to update subscription.')
    }
  }

  const handleLifecycleStatusChange = async (nextStatusLabel) => {
    if (!agent?.id || statusSaving) return
    const nextStatus = String(nextStatusLabel || '').trim().toLowerCase()
    const currentStatus = String(agent?.lifecycleStatus || '').trim().toLowerCase()
    if (!nextStatus || nextStatus === currentStatus) return

    setStatusSaving(true)
    setMockData(prev => (
      prev
        ? {
            ...prev,
            status: nextStatusLabel,
            settings: {
              ...prev.settings,
              status: nextStatusLabel,
            },
          }
        : prev
    ))

    try {
      const updated = await updateAgentLifecycleStatus(agent.id, { status: nextStatus })
      if (updated?.agent) {
        setAgent(updated.agent)
      }
      await loadAgentProfile(() => true)
      toast.success(`Agent status updated to ${nextStatusLabel}.`)
    } catch (err) {
      toast.error(err.message || 'Unable to update agent status.')
      await loadAgentProfile(() => true)
    } finally {
      setStatusSaving(false)
    }
  }

  const handleOpenMgaPackage = () => {
    navigate(`/admin/agents/${agentId}/mga-package`)
  }

  const handleCompleteApexaTask = async (activity) => {
    if (!activity?.id) return
    setCompletingApexaTask(true)
    try {
      await updateAccountActivity(activity.id, {
        details: {
          ...(activity.details || {}),
          completed: true,
          completedAt: new Date().toISOString(),
        },
      })
      await loadAgentProfile(() => true)
      toast.success('APEXA task marked as completed.')
    } catch (err) {
      toast.error(err.message || 'Unable to update the APEXA task.')
    } finally {
      setCompletingApexaTask(false)
    }
  }

  return (
    <div className="mx-auto flex h-full min-h-0 w-full  flex-col gap-5">
      <button
        type="button"
        onClick={() => navigate('/admin/agents')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft size={13} /> Back to Agents
      </button>

      {/* Pending tier upgrade request */}
      {pendingTierRequest && (
        <div className="shrink-0 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
                <CreditCard size={15} /> Tier Upgrade Request
              </div>
              <p className="mt-1 text-xs text-amber-800">
                {agent?.name || 'This agent'} requested an upgrade from
                <span className="font-semibold"> {pendingTierRequest.fromTier || agent?.subscriptionTier || '—'} </span>
                to <span className="font-semibold">{pendingTierRequest.requestedTier}</span>
                {pendingTierRequest.requestedAt ? ` on ${new Date(pendingTierRequest.requestedAt).toLocaleString()}` : ''}.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={decidingTier}
                onClick={() => handleTierDecision('approved')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-emerald-300"
              >
                <CheckCircle2 size={14} /> Approve
              </button>
              <button
                type="button"
                disabled={decidingTier}
                onClick={() => handleTierDecision('rejected')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
              >
                <X size={14} /> Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Top strip */}
        <div className="h-20 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700" />

        <div className="px-6 pb-5">
          <div className="flex flex-wrap items-end justify-between gap-4 -mt-10 mb-5">
            {/* Avatar + name */}
            <div className="flex items-end gap-4">
              <div
                className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-gradient-to-br from-blue-500 to-blue-700 text-xl font-bold text-white shadow-md"
                style={d.avatarUrl ? { backgroundImage: `url(${d.avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
              >
                {!d.avatarUrl && d.initials}
              </div>
              <div className="mb-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-bold text-slate-900">{agent?.name || 'Agent'}</h1>
                  <Badge label={d.status} color="green" />
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${tierColors[d.tier]}`}>
                    {d.tier === 'Silver' ? '🥈' : d.tier === 'Gold' ? '🥇' : '💎'} {d.tier}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-slate-500">{d.title} · License #{d.licenceNo}</p>
              </div>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-2 mb-5">
              <button
                type="button"
                onClick={handleActOnBehalf}
                disabled={actingOnBehalf}
                className="inline-flex items-center gap-2 rounded-xl border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100 transition disabled:opacity-60"
              >
                <Users size={14} /> {actingOnBehalf ? 'Starting…' : 'Act on Behalf'}
              </button>
              {/* <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
                <Edit2 size={14} /> Edit Profile
              </button> */}
              {/* <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition">
                <MoreHorizontal size={15} />
              </button> */}
            </div>
          </div>

          {/* Quick info strip */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <InfoRow icon={Phone} label="Phone" value={d.phone} />
            <InfoRow icon={Mail} label="Email" value={d.email} />
            <InfoRow icon={ShieldCheck} label="Licence Status" value={d.licenceStatus} />
            <InfoRow icon={MapPin} label="Provinces" value={d.licensing.provinces.map(p => p.code).join(', ')} />
            <InfoRow icon={Users} label="Clients" value={d.clients} />
            <InfoRow icon={Clock} label="Last Login" value={d.lastLogin} warning={d.lastLoginWarning} />
          </div>
        </div>

        {/* Tab bar */}
        <div className="border-t border-slate-100 px-6">
          <div className="flex gap-0 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative shrink-0 px-4 py-3.5 text-sm font-semibold transition-colors ${activeTab === tab.id
                    ? 'text-blue-600'
                    : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-blue-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-0 flex-1 overflow-y-auto pr-2 pb-10">
        {activeTab === 'overview' && (
          <OverviewTab
            data={d}
            agent={agent}
            onOpenMgaPackage={handleOpenMgaPackage}
            onCompleteApexaTask={handleCompleteApexaTask}
            completingApexaTask={completingApexaTask}
          />
        )}
        {activeTab === 'tier' && (
          <SettingsTab
            data={d}
            onSubscriptionChange={handleSubscriptionChange}
            onStatusChange={handleLifecycleStatusChange}
            statusSaving={statusSaving}
          />
        )}
        {activeTab === 'personal' && <ProfileTab data={d} section="personal" />}
        {activeTab === 'business' && <ProfileTab data={d} section="business" />}
        {activeTab === 'online' && <ProfileTab data={d} section="social-media" />}
        {activeTab === 'system' && <SystemSettingsInfoTab data={d} agent={agent} />}
        {activeTab === 'performance' && <PerformanceTab data={d} perf={perf} />}
        {activeTab === 'licensing' && <LicensingTab data={d} agentId={agentId} onUpdated={loadAgentProfile} />}
        {activeTab === 'documents' && <DocumentsTab data={d} />}
        {activeTab === 'tax' && <TaxDocumentsTab data={d} agentId={agentId} onUpdated={loadAgentProfile} />}
        {activeTab === 'activity' && <ActivityLogTab data={d} />}
      </div>
    </div>
  )
}
