import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BadgeCheck,
  Mail,
  Home,
  Users,
  UserPlus,
  Trash2,
  Info,
  ChevronRight,
  ArrowRight,
  X,
  Plus,
} from 'lucide-react'
import { createClient, getClient, updateClient, addHouseholdMember } from '../../utils/clients.js'
import { getAgents } from '../../utils/agents.js'
import { notify } from '../../utils/notify.js'

const TAG_OPTIONS = ['VIP', 'High Value', 'Family', 'Corporate', 'Prospect', 'Renewal Due']

const RELATIONSHIP_OPTIONS = ['Spouse', 'Child', 'Parent', 'Sibling', 'Other']

const COMMUNICATION_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
]

function validateEmail(email) {
  if (!email) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validatePhone(phone) {
  if (!phone) return false
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15
}

function validateStep1(form) {
  const errors = {}
  if (!form.firstName.trim()) errors.firstName = 'First name is required'
  if (!form.lastName.trim()) errors.lastName = 'Last name is required'
  if (!form.phone.trim()) errors.phone = 'Phone number is required'
  else if (!validatePhone(form.phone)) errors.phone = 'Enter a valid phone number (7-15 digits)'
  if (form.email && !validateEmail(form.email)) errors.email = 'Enter a valid email address'
  return errors
}

function validateStep2(form) {
  const errors = {}
  if (!form.assignedAgentId) errors.assignedAgentId = 'Please assign an agent'
  form.householdMembers.forEach((member, i) => {
    const hasFirst = member.firstName.trim()
    const hasLast = member.lastName.trim()
    if (hasFirst && !hasLast) {
      errors[`household_${i}_lastName`] = 'Last name is required'
    }
    if (!hasFirst && hasLast) {
      errors[`household_${i}_firstName`] = 'First name is required'
    }
    if ((hasFirst || hasLast) && !member.relationship) {
      errors[`household_${i}_relationship`] = 'Select a relationship'
    }
  })
  return errors
}

export default function ClientCreate() {
  const navigate = useNavigate()
  const { clientId } = useParams()
  const isEdit = Boolean(clientId)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [agentsList, setAgentsList] = useState([])
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    preferredCommunication: 'email',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    assignedAgentId: '',
    assignedAgentName: '',
    tags: [],
    householdMembers: [{ firstName: '', lastName: '', relationship: '' }],
  })

  useEffect(() => {
    getAgents()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.agents || [])
        setAgentsList(list.filter((a) => a.status === 'active'))
      })
      .catch(() => setAgentsList([]))
  }, [])

  useEffect(() => {
    if (isEdit) {
      setLoading(true)
      getClient(clientId)
        .then((data) => {
          const fullAddress = data.address || ''
          const parts = fullAddress.split(',').map((s) => s.trim())
          setForm({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            phone: data.phone || '',
            email: data.email || '',
            dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '',
            preferredCommunication: data.preferredCommunication || 'email',
            address: parts[0] || '',
            city: parts[1] || '',
            state: parts[2] || '',
            postalCode: parts[3] || '',
            assignedAgentId: data.assignedAgentId || '',
            assignedAgentName: data.assignedAgentName || '',
            tags: data.tags || [],
            householdMembers: data.householdMembers?.length
              ? data.householdMembers.map((m) => ({ firstName: m.firstName || '', lastName: m.lastName || '', relationship: m.relationship || '' }))
              : [{ firstName: '', lastName: '', relationship: '' }],
          })
        })
        .catch(() => navigate('/admin/clients', { replace: true }))
        .finally(() => setLoading(false))
    }
  }, [clientId, isEdit, navigate])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const stepErrors = step === 1 ? validateStep1(form) : validateStep2(form)
    if (stepErrors[field]) {
      setErrors((prev) => ({ ...prev, [field]: stepErrors[field] }))
    }
  }

  const toggleTag = (tag) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }))
  }

  const handleAgentChange = (agentId) => {
    const agent = agentsList.find((a) => a.id === agentId)
    setForm((prev) => ({
      ...prev,
      assignedAgentId: agentId,
      assignedAgentName: agent ? (agent.name || `${agent.firstName || ''} ${agent.lastName || ''}`.trim()) : '',
    }))
    if (errors.assignedAgentId) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.assignedAgentId
        return next
      })
    }
  }

  const addHouseholdMember = () => {
    setForm((prev) => ({
      ...prev,
      householdMembers: [...prev.householdMembers, { firstName: '', lastName: '', relationship: '' }],
    }))
  }

  const removeHouseholdMember = (index) => {
    setForm((prev) => ({
      ...prev,
      householdMembers: prev.householdMembers.filter((_, i) => i !== index),
    }))
  }

  const updateHouseholdMember = (index, field, value) => {
    setForm((prev) => {
      const updated = [...prev.householdMembers]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, householdMembers: updated }
    })
    const errKey = `household_${index}_${field}`
    if (errors[errKey]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[errKey]
        return next
      })
    }
  }

  const goToStep2 = () => {
    const stepErrors = validateStep1(form)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      setTouched({
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
      })
      return
    }
    setErrors({})
    setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const stepErrors = validateStep2(form)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }

    setSaving(true)
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        dateOfBirth: form.dateOfBirth || null,
        preferredCommunication: form.preferredCommunication,
        address: [form.address, form.city, form.state, form.postalCode].filter(Boolean).join(', '),
        assignedAgentId: form.assignedAgentId,
        assignedAgentName: form.assignedAgentName,
        tags: form.tags,
      }

      let result
      if (isEdit) {
        await updateClient(clientId, payload)
        result = { id: clientId }
      } else {
        result = await createClient(payload)
      }

      const newClientId = result.id || result.clientId

      const validMembers = form.householdMembers.filter(
        (m) => m.firstName.trim() || m.lastName.trim()
      )
      for (const member of validMembers) {
        try {
          await addHouseholdMember(newClientId, {
            firstName: member.firstName.trim(),
            lastName: member.lastName.trim(),
            relationship: member.relationship,
          })
        } catch {
          // household add failed, continue silently
        }
      }

      navigate(`/admin/clients/${newClientId}`)
    } catch (err) {
      notify.error(err.message || 'Failed to save client')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-slate-500">Loading client data...</div>
      </div>
    )
  }

  return (
    <div className="flex justify-center py-4">
      <div className="max-w-[800px] w-full">
        {/* Breadcrumb & Header */}
        <div className="mb-6 flex justify-between items-end">
          <div>
            <nav className="flex items-center gap-1 text-xs font-medium text-slate-400 mb-1">
              <span className="cursor-pointer hover:text-slate-600" onClick={() => navigate('/admin/clients')}>
                Client Management
              </span>
              <ChevronRight size={14} />
              <span className="text-brand-600 font-bold">
                {isEdit ? 'Edit Client' : 'New Client Profile'}
              </span>
            </nav>
            <h2 className="text-2xl font-bold text-slate-900">
              {isEdit ? 'Edit Client Profile' : 'Create Client Profile'}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Fill in the details to onboard a new policyholder or convert from an existing lead.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded">
              Step {step} of 2
            </span>
            <div className="w-32 h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-brand-600 transition-all duration-300"
                style={{ width: step === 1 ? '50%' : '100%' }}
              />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Main Form Card */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 space-y-6">

              {/* ====== STEP 1 ====== */}
              {step === 1 && (
                <>
                  {/* 1. Personal Details */}
                  <Section
                    icon={<BadgeCheck size={18} className="text-brand-600" />}
                    title="Personal Details"
                  >
                    <div className="grid grid-cols-2 gap-5">
                      <Field
                        label="Full Name"
                        required
                        error={touched.firstName && errors.firstName}
                      >
                        <input
                          type="text"
                          value={form.firstName}
                          onChange={(e) => handleChange('firstName', e.target.value)}
                          onBlur={() => handleBlur('firstName')}
                          placeholder="Enter first name"
                          className={inputClass(errors.firstName && touched.firstName)}
                        />
                      </Field>
                      <Field
                        label="Last Name"
                        required
                        error={touched.lastName && errors.lastName}
                      >
                        <input
                          type="text"
                          value={form.lastName}
                          onChange={(e) => handleChange('lastName', e.target.value)}
                          onBlur={() => handleBlur('lastName')}
                          placeholder="Enter last name"
                          className={inputClass(errors.lastName && touched.lastName)}
                        />
                      </Field>
                      <Field label="Date of Birth">
                        <input
                          type="date"
                          value={form.dateOfBirth}
                          onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                          className={inputClass(false)}
                        />
                      </Field>
                    </div>
                  </Section>

                  {/* 2. Contact */}
                  <Section
                    icon={<Mail size={18} className="text-brand-600" />}
                    title="Contact Information"
                  >
                    <div className="grid grid-cols-3 gap-5">
                      <Field
                        label="Phone Number"
                        required
                        error={touched.phone && errors.phone}
                      >
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          onBlur={() => handleBlur('phone')}
                          placeholder="+1 (555) 000-0000"
                          className={inputClass(errors.phone && touched.phone)}
                        />
                      </Field>
                      <Field
                        label="Email Address"
                        error={touched.email && errors.email}
                      >
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          onBlur={() => handleBlur('email')}
                          placeholder="email@example.com"
                          className={inputClass(errors.email && touched.email)}
                        />
                      </Field>
                      <Field label="Preferred Method">
                        <select
                          value={form.preferredCommunication}
                          onChange={(e) => handleChange('preferredCommunication', e.target.value)}
                          className={inputClass(false)}
                        >
                          {COMMUNICATION_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </Section>

                  {/* 3. Address */}
                  <Section
                    icon={<Home size={18} className="text-brand-600" />}
                    title="Primary Residence"
                  >
                    <div className="grid grid-cols-4 gap-5">
                      <Field label="Street Address" className="col-span-2">
                        <input
                          type="text"
                          value={form.address}
                          onChange={(e) => handleChange('address', e.target.value)}
                          placeholder="123 Financial District"
                          className={inputClass(false)}
                        />
                      </Field>
                      <Field label="City" className="col-span-2">
                        <input
                          type="text"
                          value={form.city}
                          onChange={(e) => handleChange('city', e.target.value)}
                          placeholder="Toronto"
                          className={inputClass(false)}
                        />
                      </Field>
                      <Field label="Province / State" className="col-span-2">
                        <input
                          type="text"
                          value={form.state}
                          onChange={(e) => handleChange('state', e.target.value)}
                          placeholder="Ontario"
                          className={inputClass(false)}
                        />
                      </Field>
                      <Field label="Postal Code" className="col-span-2">
                        <input
                          type="text"
                          value={form.postalCode}
                          onChange={(e) => handleChange('postalCode', e.target.value)}
                          placeholder="M5H 2N2"
                          className={inputClass(false)}
                        />
                      </Field>
                    </div>
                  </Section>
                </>
              )}

              {/* ====== STEP 2 ====== */}
              {step === 2 && (
                <>
                  {/* 4. Assignment & Tags */}
                  <Section
                    icon={<Users size={18} className="text-brand-600" />}
                    title="Assignment & Segmentation"
                  >
                    <div className="grid grid-cols-2 gap-5">
                      <Field
                        label="Assigned Agent"
                        required
                        error={touched.assignedAgentId && errors.assignedAgentId}
                      >
                        <select
                          value={form.assignedAgentId}
                          onChange={(e) => handleAgentChange(e.target.value)}
                          onBlur={() => handleBlur('assignedAgentId')}
                          className={inputClass(errors.assignedAgentId && touched.assignedAgentId)}
                        >
                          <option value="">Select an agent</option>
                          {agentsList.map((agent) => (
                            <option key={agent.id} value={agent.id}>
                              {agent.name || `${agent.firstName || ''} ${agent.lastName || ''}`.trim()}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Segment Tags">
                        <div className="flex flex-wrap gap-2 pt-1">
                          {TAG_OPTIONS.map((tag) => {
                            const active = form.tags.includes(tag)
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => toggleTag(tag)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 transition-colors ${
                                  active
                                    ? 'bg-brand-600 text-white border-brand-600'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-brand-300'
                                }`}
                              >
                                {tag}
                                {active ? <X size={12} /> : <Plus size={12} />}
                              </button>
                            )
                          })}
                        </div>
                      </Field>
                    </div>
                  </Section>

                  {/* 5. Household */}
                  <Section
                    icon={<UserPlus size={18} className="text-brand-600" />}
                    title="Household Members"
                    action={
                      <button
                        type="button"
                        onClick={addHouseholdMember}
                        className="flex items-center gap-1 text-brand-600 font-bold text-xs hover:underline"
                      >
                        <Plus size={14} />
                        Link family members
                      </button>
                    }
                  >
                    <div className="space-y-3">
                      {form.householdMembers.map((member, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 bg-slate-50 p-4 rounded-lg"
                        >
                          <div className="flex-1">
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              First Name
                            </label>
                            <input
                              type="text"
                              value={member.firstName}
                              onChange={(e) => updateHouseholdMember(index, 'firstName', e.target.value)}
                              placeholder="First name"
                              className={inputClass(errors[`household_${index}_firstName`])}
                            />
                            {errors[`household_${index}_firstName`] && (
                              <p className="text-xs text-red-500 mt-1">{errors[`household_${index}_firstName`]}</p>
                            )}
                          </div>
                          <div className="flex-1">
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Last Name
                            </label>
                            <input
                              type="text"
                              value={member.lastName}
                              onChange={(e) => updateHouseholdMember(index, 'lastName', e.target.value)}
                              placeholder="Last name"
                              className={inputClass(errors[`household_${index}_lastName`])}
                            />
                            {errors[`household_${index}_lastName`] && (
                              <p className="text-xs text-red-500 mt-1">{errors[`household_${index}_lastName`]}</p>
                            )}
                          </div>
                          <div className="flex-1">
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Relationship
                            </label>
                            <select
                              value={member.relationship}
                              onChange={(e) => updateHouseholdMember(index, 'relationship', e.target.value)}
                              className={inputClass(errors[`household_${index}_relationship`])}
                            >
                              <option value="">Select</option>
                              {RELATIONSHIP_OPTIONS.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                            {errors[`household_${index}_relationship`] && (
                              <p className="text-xs text-red-500 mt-1">{errors[`household_${index}_relationship`]}</p>
                            )}
                          </div>
                          {form.householdMembers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeHouseholdMember(index)}
                              className="mt-5 p-2 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </Section>
                </>
              )}
            </div>

            {/* Footer Actions */}
            <footer className="bg-slate-50 px-6 py-4 flex justify-between items-center border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  if (step === 2) {
                    setStep(1)
                    setErrors({})
                  } else {
                    navigate(isEdit ? `/admin/clients/${clientId}` : '/admin/clients')
                  }
                }}
                className="px-6 h-11 rounded-lg border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-100 transition-all"
              >
                {step === 2 ? 'Back' : 'Cancel'}
              </button>
              <div className="flex gap-3">
                {step === 1 ? (
                  <button
                    type="button"
                    onClick={goToStep2}
                    className="px-6 h-11 rounded-lg bg-brand-600 text-white font-bold text-sm shadow-lg shadow-brand-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                  >
                    Next Step
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 h-11 rounded-lg bg-brand-600 text-white font-bold text-sm shadow-lg shadow-brand-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : isEdit ? 'Update Client Profile' : 'Create Client Profile'}
                    {!saving && <ArrowRight size={16} />}
                  </button>
                )}
              </div>
            </footer>
          </div>

          <p className="text-center mt-4 text-slate-400 text-xs">
            All data is encrypted and stored according to industry-standard security protocols.
          </p>
        </form>
      </div>
    </div>
  )
}

function Section({ icon, title, children, action }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-base font-bold text-slate-800">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function Field({ label, required, error, children, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function inputClass(hasError) {
  const base =
    'w-full h-10 px-3 rounded-lg border text-sm outline-none transition-all'
  if (hasError) {
    return `${base} border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200 bg-red-50/50`
  }
  return `${base} border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-100 bg-white`
}
