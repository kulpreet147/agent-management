import { useEffect, useRef, useState } from "react";
import { auth } from "../../utils/auth.js";
import AgentSidebar from "../../components/AgentSidebar.jsx";
import { getAgent, getAgentProfile, updateAgentProfile } from "../../utils/agents.js";

function normalizePhoneDigits(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 11);
}

function formatUsCaPhone(value) {
  const raw = normalizePhoneDigits(value);
  const digits = raw.length === 11 && raw.startsWith("1") ? raw.slice(1) : raw;
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

function resolveMediaUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
  const origin = apiBase.replace(/\/api\/?$/, "");
  return `${origin}${url.startsWith("/") ? url : `/${url}`}`;
}

function readAvatarPathFromAgent(agent) {
  const avatar = agent?.documents?.profileAvatar;
  if (!avatar) return "";
  if (avatar.fileName) return `/uploads/agents/${avatar.fileName}`;
  if (avatar.path) {
    const normalized = String(avatar.path).replace(/\\/g, "/");
    const idx = normalized.indexOf("/uploads/");
    if (idx >= 0) return normalized.slice(idx);
  }
  return "";
}

const css = {
  page: { minHeight: "100vh", background: "#eef3f8", color: "#020617", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" },
  header: { background: "#1a1d27", borderBottom: "1px solid #2e3248", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  logo: { fontSize: 15, fontWeight: 700, letterSpacing: -0.3 },
  logoSpan: { color: "#4f8ef7" },
  backBtn: { display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#9095b0", background: "#222534", border: "1px solid #2e3248", borderRadius: 6, padding: "5px 12px", cursor: "pointer" },
  headerRight: { display: "flex", alignItems: "center", gap: 10 },
  iconBtn: { width: 34, height: 34, borderRadius: 8, border: "1px solid #2e3248", background: "#222534", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9095b0", fontSize: 15 },
  avatar: { width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #4f8ef7, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, cursor: "pointer", border: "2px solid #3a3f5c", color: "#fff" },
  layout: { display: "flex", flex: 1 },
  sidebar: { width: 220, background: "#1a1d27", borderRight: "1px solid #2e3248", padding: "20px 0", flexShrink: 0, display: "flex", flexDirection: "column", minHeight: "calc(100vh - 56px)" },
  sidebarLabel: { fontSize: 10, fontWeight: 600, color: "#5a5f7a", letterSpacing: 1, textTransform: "uppercase", padding: "0 18px 8px" },
  sidebarItem: (active) => ({ display: "flex", alignItems: "center", gap: 10, padding: "9px 18px", fontSize: 13.5, color: active ? "#4f8ef7" : "#9095b0", cursor: "pointer", borderLeft: `2px solid ${active ? "#4f8ef7" : "transparent"}`, background: active ? "rgba(79,142,247,0.08)" : "transparent" }),
  sidebarBottom: { marginTop: "auto", borderTop: "1px solid #2e3248", paddingTop: 12 },
  main: { flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" },
  pageHeader: { padding: "28px 36px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" },
  pageTitle: { fontSize: 38, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.1 },
  pageSub: { fontSize: 12, color: "#64748b", marginTop: 8, fontWeight: 600 },
  tabsBar: { display: "flex", padding: "20px 36px 0", borderBottom: "1px solid #cbd5e1", marginBottom: 20 },
  tab: (active) => ({ padding: "10px 20px", fontSize: 13, fontWeight: 700, color: active ? "#1d4ed8" : "#64748b", cursor: "pointer", borderBottom: `2px solid ${active ? "#1d4ed8" : "transparent"}`, marginBottom: -1, transition: "all 0.15s" }),
  content: { padding: "0 36px 28px", flex: 1, minHeight: 0, overflowY: "auto" },
  panel: { background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 10, padding: 22, marginBottom: 18, boxShadow: "0 1px 2px rgba(15,23,42,0.06)" },
  panelTitle: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 },
  avatarUpload: { display: "flex", alignItems: "center", gap: 20, marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #e2e8f0" },
  avatarLarge: { width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #4f8ef7, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, position: "relative", flexShrink: 0, color: "#fff" },
  avatarBadge: { position: "absolute", bottom: 0, right: 0, width: 22, height: 22, background: "#2563eb", borderRadius: "50%", border: "2px solid #ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, cursor: "pointer" },
  uploadBtn: { marginTop: 8, fontSize: 12, color: "#2563eb", cursor: "pointer", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, padding: "4px 10px", display: "inline-block" },
  formGrid: (cols = 2) => ({ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }),
  field: { display: "flex", flexDirection: "column", gap: 6 },
  fieldFull: { display: "flex", flexDirection: "column", gap: 6, gridColumn: "1 / -1" },
  label: { fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.4 },
  input: { background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#0f172a", width: "100%", outline: "none", fontFamily: "inherit", fontWeight: 500 },
  select: { background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#0f172a", width: "100%", outline: "none", fontFamily: "inherit", appearance: "none", fontWeight: 500 },
  textarea: { background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#0f172a", width: "100%", outline: "none", fontFamily: "inherit", resize: "vertical", minHeight: 80, fontWeight: 500 },
  tagContainer: { background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, padding: "6px 10px", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", minHeight: 40 },
  tag: { background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", fontSize: 12, padding: "2px 8px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 },
  tagAdd: { fontSize: 12, color: "#64748b", cursor: "pointer" },
  toggleRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid #e2e8f0" },
  toggle: (on) => ({ width: 42, height: 24, borderRadius: 12, background: on ? "#2563eb" : "#cbd5e1", border: `1px solid ${on ? "#2563eb" : "#94a3b8"}`, position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }),
  toggleKnob: (on) => ({ position: "absolute", top: 2, left: on ? 20 : 2, width: 18, height: 18, borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }),
  btnRow: { display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 },
  btnPrimary: { padding: "9px 20px", borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: "pointer", background: "#4f8ef7", color: "white", border: "none", fontFamily: "inherit" },
  btnSecondary: { padding: "9px 20px", borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: "pointer", background: "#ffffff", color: "#334155", border: "1px solid #cbd5e1", fontFamily: "inherit" },
  btnSuccess: { padding: "9px 20px", borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: "pointer", background: "#15803d", color: "white", border: "none", fontFamily: "inherit" },
  areaTag: (sel) => ({ background: sel ? "#eff6ff" : "#f8fafc", border: `1px solid ${sel ? "#bfdbfe" : "#cbd5e1"}`, color: sel ? "#1d4ed8" : "#334155", fontSize: 12, padding: "4px 10px", borderRadius: 20, cursor: "pointer" }),
  socialRow: { display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #e2e8f0" },
  socialIcon: (bg, color) => ({ width: 32, height: 32, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0, color }),
  statusBar: { display: "flex", gap: 20, padding: "14px 20px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, marginTop: 20, flexWrap: "wrap" },
};

function Toggle({ value, onChange, disabled = false }) {
  return (
    <div
      style={{ ...css.toggle(value), opacity: disabled ? 0.6 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
      onClick={() => {
        if (disabled) return;
        onChange(!value);
      }}
    >
      <div style={css.toggleKnob(value)} />
    </div>
  );
}

function PersonalTab() {
  const [married, setMarried] = useState(true);
  const [hasChildren, setHasChildren] = useState(false);
  const [children, setChildren] = useState([{ name: "", age: "", sex: "Male" }]);
  const [languages, setLanguages] = useState(["English", "French"]);
  const [residence, setResidence] = useState("Owned");

  const addChild = () => {
    setChildren((prev) => [...prev, { name: "", age: "", sex: "Male" }]);
  };

  const updateChild = (index, field, value) => {
    setChildren((prev) =>
      prev.map((child, i) => (i === index ? { ...child, [field]: value } : child))
    );
  };

  return (
    <div>
      <div style={css.panel}>
        <div style={css.avatarUpload}>
          <div style={css.avatarLarge}>
            AG
            <div style={css.avatarBadge}>✎</div>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Agent</div>
            <div style={{ fontSize: 12, color: "#9095b0", marginTop: 3 }}>agent@example.com</div>
            <div style={css.uploadBtn}>Upload Photo</div>
          </div>
        </div>

        <div style={css.formGrid(2)}>
          <div style={css.field}>
            <label style={css.label}>Business Phone</label>
            <input style={css.input} defaultValue="+1 (555) 000-0001" />
          </div>
          <div style={css.field}>
            <label style={css.label}>Emergency Contact Name</label>
            <input style={css.input} placeholder="Full Name" />
          </div>
          <div style={css.field}>
            <label style={css.label}>Emergency Contact Phone</label>
            <input style={css.input} defaultValue="+1 (345) 000-0001" />
          </div>
          <div style={css.field}>
            <label style={css.label}>Relationship</label>
            <select style={css.select}>
              <option>Spouse</option><option>Parent</option><option>Sibling</option><option>Other</option>
            </select>
          </div>
          <div style={css.fieldFull}>
            <label style={css.label}>Business Address</label>
            <input style={css.input} defaultValue="123 Financial Ave" />
          </div>
          <div style={css.field}>
            <label style={css.label}>City</label>
            <input style={css.input} defaultValue="Toronto" />
          </div>
          <div style={css.field}>
            <label style={css.label}>Province</label>
            <select style={css.select}>
              <option>ON</option><option>BC</option><option>AB</option><option>QC</option>
            </select>
          </div>
          <div style={css.field}>
            <label style={css.label}>Postal Code</label>
            <input style={css.input} defaultValue="M5V 2L1" />
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <label style={css.label}>Languages</label>
          <div style={{ ...css.tagContainer, marginTop: 6 }}>
            {languages.map(lang => (
              <div key={lang} style={css.tag}>
                {lang}
                <span style={{ cursor: "pointer", opacity: 0.6 }} onClick={() => setLanguages(l => l.filter(x => x !== lang))}>×</span>
              </div>
            ))}
            <span style={css.tagAdd}>+ Add language...</span>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <label style={css.label}>Residence</label>
          <div style={{ display: "flex", gap: 24, marginTop: 8 }}>
            {["Owned", "Rental"].map(r => (
              <label key={r} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                <input type="radio" name="residence" checked={residence === r} onChange={() => setResidence(r)} style={{ accentColor: "#4f8ef7" }} /> {r}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div style={css.panel}>
        <div style={css.toggleRow}>
          <div style={{ fontSize: 13.5, fontWeight: 500 }}>Married?</div>
          <Toggle value={married} onChange={setMarried} />
        </div>
        {married && (
          <div style={{ ...css.formGrid(3), marginTop: 16 }}>
            <div style={css.field}><label style={css.label}>Spouse Name</label><input style={css.input} placeholder="Name" /></div>
            <div style={css.field}><label style={css.label}>Spouse DOB</label><input type="date" style={css.input} /></div>
            <div style={css.field}><label style={css.label}>Spouse Email</label><input type="email" style={css.input} placeholder="Email" /></div>
          </div>
        )}
        <div style={{ ...css.toggleRow, marginTop: 16, borderBottom: "none" }}>
          <div style={{ fontSize: 13.5, fontWeight: 500 }}>Have Children?</div>
          <Toggle value={hasChildren} onChange={setHasChildren} />
        </div>
        {hasChildren && (
          <div style={{ marginTop: 16 }}>
            {children.map((child, index) => (
              <div key={index} style={{ ...css.formGrid(3), marginBottom: 12 }}>
                <div style={css.field}>
                  <label style={css.label}>Child Name</label>
                  <input
                    style={css.input}
                    placeholder="Name"
                    value={child.name}
                    onChange={(e) => updateChild(index, "name", e.target.value)}
                  />
                </div>
                <div style={css.field}>
                  <label style={css.label}>Age</label>
                  <input
                    type="number"
                    min="0"
                    style={css.input}
                    placeholder="Age"
                    value={child.age}
                    onChange={(e) => updateChild(index, "age", e.target.value)}
                  />
                </div>
                <div style={css.field}>
                  <label style={css.label}>Sex</label>
                  <select
                    style={css.select}
                    value={child.sex}
                    onChange={(e) => updateChild(index, "sex", e.target.value)}
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
            ))}
            <button type="button" style={css.uploadBtn} onClick={addChild}>
              + Add Child
            </button>
          </div>
        )}
      </div>

      <div style={css.btnRow}>
        <button style={css.btnSecondary}>Cancel</button>
        <button style={css.btnPrimary}>Save Changes</button>
      </div>
    </div>
  );
}

function ProfessionalTab() {
  const [areas, setAreas] = useState(["Toronto", "Etobicoke"]);
  const allAreas = ["Toronto", "Etobicoke", "Mississauga", "Vaughan", "Brampton", "Markham", "Richmond Hill"];
  const toggleArea = (a) => setAreas(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  return (
    <div>
      <div style={css.panel}>
        <div style={css.panelTitle}>Agent Profile</div>
        <div style={{ fontSize: 12, color: "#9095b0", marginBottom: 20 }}>Manage professional credentials and service registry</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={css.field}>
            <label style={css.label}>Bio</label>
            <textarea style={css.textarea} rows={4} defaultValue="Experienced real estate agent with a focus on high-end residential properties in the Greater Toronto Area. Dedicated to providing client-centric solutions and data-driven market insights." />
          </div>
          <div style={css.field}>
            <label style={css.label}>Years of Experience</label>
            <input type="number" style={{ ...css.input, width: 120 }} defaultValue="6" />
          </div>
          <div style={css.field}>
            <label style={css.label}>Licence Details</label>
            <input style={css.input} defaultValue="A4-3226-92492 | Expiry: May 31, 2026 | Type: Existing | Issuing Transfer" />
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <label style={css.label}>Areas Served</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            {allAreas.map(a => (
              <div key={a} style={css.areaTag(areas.includes(a))} onClick={() => toggleArea(a)}>{a}</div>
            ))}
            <div style={css.areaTag(false)}>+ Add</div>
          </div>
        </div>
      </div>

      <div style={css.statusBar}>
        <div>
          <div style={{ fontSize: 11, color: "#5a5f7a", fontWeight: 500, marginBottom: 4 }}>PROFILE VISIBILITY</div>
          <div style={{ fontSize: 12.5, color: "#9095b0" }}>
            <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#22c55e", marginRight: 6 }} />
            Your professional details are visible to administrators and appropriate roles
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#5a5f7a", fontWeight: 500, marginBottom: 4 }}>LAST EDITED</div>
          <div style={{ fontSize: 12.5, color: "#9095b0" }}>October 11, 2023 by Agent Admin</div>
        </div>
      </div>

      <div style={css.btnRow}>
        <button style={css.btnSecondary}>Cancel</button>
        <button style={css.btnPrimary}>Save Changes</button>
      </div>
    </div>
  );
}

const SOCIALS = [
  { name: "LinkedIn", icon: "in", bg: "rgba(10,102,194,0.15)", color: "#0a66c2", placeholder: "linkedin.com/in/yourprofile" },
  { name: "Instagram", icon: "IG", bg: "rgba(225,48,108,0.12)", color: "#e1306c", placeholder: "instagram.com/yourhandle" },
  { name: "Facebook", icon: "f", bg: "rgba(24,119,242,0.12)", color: "#1877f2", placeholder: "facebook.com/yourpage" },
  { name: "Twitter", icon: "X", bg: "rgba(0,0,0,0.3)", color: "#e8eaf0", placeholder: "twitter.com/yourhandle" },
  { name: "YouTube", icon: "▶", bg: "rgba(255,0,0,0.12)", color: "#ff0000", placeholder: "youtube.com/yourchannel" },
  { name: "Website", icon: "W", bg: "rgba(110,231,183,0.12)", color: "#6ee7b7", placeholder: "youragencysite.com" },
];

function BusinessTab() {
  const [consent, setConsent] = useState(true);
  return (
    <div>
      <div style={{ ...css.pageTitle, marginBottom: 4, fontSize: 18 }}>Complete Your Profile</div>
      <div style={{ fontSize: 13, color: "#9095b0", marginBottom: 24, display: "flex", gap: 24 }}>
        <span style={{ color: "#5a5f7a" }}>Personal ✓</span>
        <span style={{ color: "#5a5f7a" }}>Professional ✓</span>
        <span style={{ color: "#4f8ef7", fontWeight: 600 }}>Business ●</span>
      </div>

      <div style={css.panel}>
        <div style={css.panelTitle}>Social Media Links</div>
        {SOCIALS.map(s => (
          <div key={s.name} style={{ ...css.socialRow, ...(s === SOCIALS[SOCIALS.length - 1] ? { borderBottom: "none" } : {}) }}>
            <div style={css.socialIcon(s.bg, s.color)}>{s.icon}</div>
            <div style={{ fontSize: 13, color: "#9095b0", width: 90, flexShrink: 0 }}>{s.name}</div>
            <input type="url" style={{ ...css.input }} placeholder={s.placeholder} />
          </div>
        ))}
      </div>

      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 16, cursor: "pointer" }}>
        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} style={{ marginTop: 2, accentColor: "#4f8ef7" }} />
        <span style={{ fontSize: 12, color: "#9095b0" }}>
          By saving, we will generate your business card, social media covers, email signature and social media analytics following after admin approval.
        </span>
      </label>

      <div style={css.btnRow}>
        <button style={css.btnSecondary}>Cancel</button>
        <button style={css.btnSuccess}>Save & Complete Profile</button>
      </div>
    </div>
  );
}

const TABS = ["Personal", "Professional", "Business"];

export default function AgentProfile() {
  const session = auth.get();
  const [agentData, setAgentData] = useState(null);
  const agentName = agentData?.name || session?.name || "Agent";
  const agentEmail = agentData?.email || session?.email || "";
  const initials = agentName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const [activeTab, setActiveTab] = useState("Personal");
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [personal, setPersonal] = useState({
    businessPhone: "+1 (555) 000-0001",
    emergencyContactPhone: "+1 (345) 000-0001",
    businessAddress: "123 Financial Ave",
    city: "Toronto",
    postalCode: "M5V 2L1",
    residence: "Owned",
    married: true,
    spouseName: "",
    spouseDob: "",
    spouseEmail: "",
    hasChildren: false,
    children: [{ name: "", age: "", gender: "Male" }],
  });
  const [professional, setProfessional] = useState({
    bio: "Experienced real estate agent with a focus on high-end residential properties in the Greater Toronto Area. Dedicated to providing client-centric solutions and data-driven market insights.",
    yearsOfExperience: "6",
    licenceDetails: "A4-3226-92492 | Expiry: May 31, 2026 | Type: Existing | Issuing Transfer",
  });
  const [business, setBusiness] = useState({
    consent: true,
    socials: {
      linkedin: "",
      instagram: "",
      facebook: "",
      twitter: "",
      youtube: "",
      website: "",
    },
  });
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    if (!session?.id) return;
    Promise.all([getAgent(session.id), getAgentProfile(session.id)])
      .then(([agent, data]) => {
        setAgentData(agent || null);
        const profile = data?.profile || data || {};
        if (agent) {
          setPersonal((prev) => ({
            ...prev,
            businessPhone: prev.businessPhone || agent.phone || "",
            city: prev.city || agent.city || "",
            postalCode: prev.postalCode || agent.postalCode || "",
          }));
          setProfessional((prev) => ({
            ...prev,
            licenceDetails:
              prev.licenceDetails ||
              [agent.licenceType, agent.agentCode].filter(Boolean).join(" | "),
          }));
        }
        if (profile.personal) {
          setPersonal((prev) => ({ ...prev, ...profile.personal }));
        }
        if (profile.professional) {
          setProfessional((prev) => ({ ...prev, ...profile.professional }));
        }
        if (profile.business) {
          setBusiness((prev) => ({ ...prev, ...profile.business }));
        }
        const avatarUrl =
          data?.avatarUrl ||
          profile?.avatarUrl ||
          readAvatarPathFromAgent(data) ||
          readAvatarPathFromAgent(agent);
        if (avatarUrl) {
          setAvatarPreview(resolveMediaUrl(`${avatarUrl}?t=${Date.now()}`));
        }
      })
      .catch(() => {});
  }, [session?.id]);

  const handleSaveProfile = async () => {
    if (!session?.id) return;
    setSaving(true);
    try {
      const payload = {
        personal,
        professional,
        business,
        relationships: {
          spouse: personal.married
            ? {
                name: personal.spouseName || null,
                dob: personal.spouseDob || null,
                email: personal.spouseEmail || null,
              }
            : null,
          children: personal.hasChildren
            ? personal.children.map((child) => ({
                name: child.name || null,
                age: child.age === "" ? null : Number(child.age),
                gender: child.gender || null,
              }))
            : [],
        },
      };
      const formData = new FormData();
      formData.append("profile", JSON.stringify(payload));
      if (avatarFile) formData.append("avatar", avatarFile);
      const updated = await updateAgentProfile(session.id, formData);
      const nextAvatarUrl = updated?.avatarUrl || readAvatarPathFromAgent(updated?.agent);
      if (nextAvatarUrl) {
        setAvatarPreview(resolveMediaUrl(`${nextAvatarUrl}?t=${Date.now()}`));
      }
      window.alert("Profile updated successfully.");
      setIsEditing(false);
    } catch (error) {
      window.alert(error.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117]">
      <div className="flex h-screen overflow-hidden">
        <AgentSidebar agentName={agentName} initials={initials} />
        <div style={{ ...css.page, flex: 1 }}>
          <div style={css.main}>
            <div style={css.pageHeader}>
              <div>
                <div style={css.pageTitle}>My Profile</div>
                <div style={css.pageSub}>Only you are able to edit this.</div>
              </div>
              <div>
                {!isEditing ? (
                  <button type="button" style={css.btnPrimary} onClick={() => setIsEditing(true)}>
                    Update Profile
                  </button>
                ) : (
                  <button type="button" style={css.btnSecondary} onClick={() => setIsEditing(false)}>
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>

            <div style={css.tabsBar}>
              {TABS.map(tab => (
                <div key={tab} style={css.tab(activeTab === tab)} onClick={() => setActiveTab(tab)}>
                  {tab}
                </div>
              ))}
            </div>

            <div style={css.content}>
              {activeTab === "Personal" && (
                <PersonalTabConnected
                  css={css}
                  agentName={agentName}
                  agentEmail={agentEmail}
                  personal={personal}
                  setPersonal={setPersonal}
                  avatarPreview={avatarPreview}
                  setAvatarPreview={setAvatarPreview}
                  setAvatarFile={setAvatarFile}
                  isEditing={isEditing}
                  onNext={() => setActiveTab("Professional")}
                />
              )}
              {activeTab === "Professional" && (
                <ProfessionalTabConnected
                  css={css}
                  professional={professional}
                  setProfessional={setProfessional}
                  isEditing={isEditing}
                  onBack={() => setActiveTab("Personal")}
                  onNext={() => setActiveTab("Business")}
                />
              )}
              {activeTab === "Business" && (
                <BusinessTabConnected
                  css={css}
                  business={business}
                  setBusiness={setBusiness}
                  isEditing={isEditing}
                  onBack={() => setActiveTab("Professional")}
                  onSave={handleSaveProfile}
                  saving={saving}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonalTabConnected({ css, agentName, agentEmail, personal, setPersonal, avatarPreview, setAvatarPreview, setAvatarFile, isEditing, onNext }) {
  const fileInputRef = useRef(null);
  const addChild = () =>
    setPersonal((prev) => ({
      ...prev,
      children: [...(prev.children || []), { name: "", age: "", gender: "Male" }],
    }));

  const updateChild = (index, field, value) =>
    setPersonal((prev) => ({
      ...prev,
      children: prev.children.map((child, i) => (i === index ? { ...child, [field]: value } : child)),
    }));
  
  const handleSelectPhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div style={css.panel}>
        <div style={css.avatarUpload}>
          <div
            style={{
              ...css.avatarLarge,
              backgroundImage: avatarPreview ? `url(${avatarPreview})` : css.avatarLarge.background,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {!avatarPreview ? (agentName || "A").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() : ""}
            <button type="button" style={css.avatarBadge} disabled={!isEditing} onClick={() => fileInputRef.current?.click()}>✎</button>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{agentName}</div>
            <div style={{ fontSize: 12, color: "#9095b0", marginTop: 3 }}>{agentEmail}</div>
            <button type="button" style={{ ...css.uploadBtn, opacity: isEditing ? 1 : 0.6, cursor: isEditing ? "pointer" : "not-allowed" }} disabled={!isEditing} onClick={() => fileInputRef.current?.click()}>Upload Photo</button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleSelectPhoto}
              style={{ display: "none" }}
            />
          </div>
        </div>

        <div style={css.formGrid(2)}>
          <div style={css.field}>
            <label style={css.label}>Business Phone</label>
            <input
              style={css.input}
              value={personal.businessPhone || ""}
              onChange={(e) => setPersonal((p) => ({ ...p, businessPhone: formatUsCaPhone(e.target.value) }))}
              disabled={!isEditing}
              inputMode="tel"
              maxLength={14}
              placeholder="(604) 555-0123"
            />
          </div>
          <div style={css.field}>
            <label style={css.label}>Emergency Contact Phone</label>
            <input
              style={css.input}
              value={personal.emergencyContactPhone || ""}
              onChange={(e) => setPersonal((p) => ({ ...p, emergencyContactPhone: formatUsCaPhone(e.target.value) }))}
              disabled={!isEditing}
              inputMode="tel"
              maxLength={14}
              placeholder="(604) 555-0123"
            />
          </div>
          <div style={css.fieldFull}><label style={css.label}>Business Address</label><input style={css.input} value={personal.businessAddress || ""} disabled={!isEditing} onChange={(e) => setPersonal((p) => ({ ...p, businessAddress: e.target.value }))} /></div>
          <div style={css.field}><label style={css.label}>City</label><input style={css.input} value={personal.city || ""} disabled={!isEditing} onChange={(e) => setPersonal((p) => ({ ...p, city: e.target.value }))} /></div>
          <div style={css.field}><label style={css.label}>Postal Code</label><input style={css.input} value={personal.postalCode || ""} disabled={!isEditing} onChange={(e) => setPersonal((p) => ({ ...p, postalCode: e.target.value }))} /></div>
        </div>

        <div style={{ marginTop: 20 }}>
          <label style={css.label}>Residence</label>
          <div style={{ display: "flex", gap: 24, marginTop: 8 }}>
            {["Owned", "Rental"].map((r) => (
              <label key={r} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                <input type="radio" name="residence" checked={personal.residence === r} disabled={!isEditing} onChange={() => setPersonal((p) => ({ ...p, residence: r }))} style={{ accentColor: "#4f8ef7" }} /> {r}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div style={css.panel}>
        <div style={css.toggleRow}>
          <div style={{ fontSize: 13.5, fontWeight: 500 }}>Married?</div>
          <Toggle value={!!personal.married} onChange={(v) => setPersonal((p) => ({ ...p, married: v }))} disabled={!isEditing} />
        </div>
        {personal.married && (
          <div style={{ ...css.formGrid(3), marginTop: 16 }}>
            <div style={css.field}><label style={css.label}>Spouse Name</label><input style={css.input} value={personal.spouseName || ""} disabled={!isEditing} onChange={(e) => setPersonal((p) => ({ ...p, spouseName: e.target.value }))} /></div>
            <div style={css.field}><label style={css.label}>Spouse DOB</label><input type="date" style={css.input} value={personal.spouseDob || ""} disabled={!isEditing} onChange={(e) => setPersonal((p) => ({ ...p, spouseDob: e.target.value }))} /></div>
            <div style={css.field}><label style={css.label}>Spouse Email</label><input type="email" style={css.input} value={personal.spouseEmail || ""} disabled={!isEditing} onChange={(e) => setPersonal((p) => ({ ...p, spouseEmail: e.target.value }))} /></div>
          </div>
        )}
        <div style={{ ...css.toggleRow, marginTop: 16, borderBottom: "none" }}>
          <div style={{ fontSize: 13.5, fontWeight: 500 }}>Have Children?</div>
          <Toggle value={!!personal.hasChildren} onChange={(v) => setPersonal((p) => ({ ...p, hasChildren: v }))} disabled={!isEditing} />
        </div>
        {personal.hasChildren && (
          <div style={{ marginTop: 16 }}>
            {(personal.children || []).map((child, index) => (
              <div key={index} style={{ ...css.formGrid(3), marginBottom: 12 }}>
                <div style={css.field}><label style={css.label}>Child Name</label><input style={css.input} value={child.name || ""} disabled={!isEditing} onChange={(e) => updateChild(index, "name", e.target.value)} /></div>
                <div style={css.field}><label style={css.label}>Age</label><input type="number" min="0" style={css.input} value={child.age ?? ""} disabled={!isEditing} onChange={(e) => updateChild(index, "age", e.target.value)} /></div>
                <div style={css.field}><label style={css.label}>Gender</label><select style={css.select} value={child.gender || "Male"} disabled={!isEditing} onChange={(e) => updateChild(index, "gender", e.target.value)}><option>Male</option><option>Female</option><option>Other</option></select></div>
              </div>
            ))}
            <button type="button" style={{ ...css.uploadBtn, opacity: isEditing ? 1 : 0.6, cursor: isEditing ? "pointer" : "not-allowed" }} disabled={!isEditing} onClick={addChild}>+ Add Child</button>
          </div>
        )}
      </div>

      {isEditing && (
        <div style={css.btnRow}>
          <button type="button" style={css.btnPrimary} onClick={onNext}>Next</button>
        </div>
      )}
    </div>
  );
}

function ProfessionalTabConnected({ css, professional, setProfessional, isEditing, onBack, onNext }) {
  return (
    <div>
      <div style={css.panel}>
        <div style={css.panelTitle}>Agent Profile</div>
        <div style={{ fontSize: 12, color: "#9095b0", marginBottom: 20 }}>Manage professional credentials and service registry</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={css.field}><label style={css.label}>Bio</label><textarea style={css.textarea} rows={4} value={professional.bio || ""} disabled={!isEditing} onChange={(e) => setProfessional((p) => ({ ...p, bio: e.target.value }))} /></div>
          <div style={css.field}><label style={css.label}>Years of Experience</label><input type="number" style={{ ...css.input, width: 120 }} value={professional.yearsOfExperience || ""} disabled={!isEditing} onChange={(e) => setProfessional((p) => ({ ...p, yearsOfExperience: e.target.value }))} /></div>
          <div style={css.field}><label style={css.label}>Licence Details</label><input style={css.input} value={professional.licenceDetails || ""} disabled={!isEditing} onChange={(e) => setProfessional((p) => ({ ...p, licenceDetails: e.target.value }))} /></div>
        </div>
      </div>
      {isEditing && (
        <div style={css.btnRow}>
          <button type="button" style={css.btnSecondary} onClick={onBack}>Back</button>
          <button type="button" style={css.btnPrimary} onClick={onNext}>Next</button>
        </div>
      )}
    </div>
  );
}

function BusinessTabConnected({ css, business, setBusiness, isEditing, onBack, onSave, saving }) {
  return (
    <div>
      <div style={{ ...css.pageTitle, marginBottom: 4, fontSize: 18 }}>Complete Your Profile</div>
      <div style={{ fontSize: 13, color: "#9095b0", marginBottom: 24, display: "flex", gap: 24 }}>
        <span style={{ color: "#5a5f7a" }}>Personal ✓</span>
        <span style={{ color: "#5a5f7a" }}>Professional ✓</span>
        <span style={{ color: "#4f8ef7", fontWeight: 600 }}>Business ●</span>
      </div>
      <div style={css.panel}>
        <div style={css.panelTitle}>Social Media Links</div>
        {SOCIALS.map((s, index) => {
          const key = s.name.toLowerCase();
          return (
            <div key={s.name} style={{ ...css.socialRow, ...(index === SOCIALS.length - 1 ? { borderBottom: "none" } : {}) }}>
              <div style={css.socialIcon(s.bg, s.color)}>{s.icon}</div>
              <div style={{ fontSize: 13, color: "#9095b0", width: 90, flexShrink: 0 }}>{s.name}</div>
              <input type="url" style={{ ...css.input }} placeholder={s.placeholder} value={business.socials[key] || ""} disabled={!isEditing} onChange={(e) => setBusiness((prev) => ({ ...prev, socials: { ...prev.socials, [key]: e.target.value } }))} />
            </div>
          );
        })}
      </div>
      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 16, cursor: "pointer" }}>
        <input type="checkbox" checked={!!business.consent} disabled={!isEditing} onChange={(e) => setBusiness((prev) => ({ ...prev, consent: e.target.checked }))} style={{ marginTop: 2, accentColor: "#4f8ef7" }} />
        <span style={{ fontSize: 12, color: "#9095b0" }}>
          By saving, we will generate your business card, social media covers, email signature and social media analytics following after admin approval.
        </span>
      </label>
      {isEditing && (
        <div style={css.btnRow}>
          <button type="button" style={css.btnSecondary} onClick={onBack}>Back</button>
          <button type="button" style={css.btnSuccess} onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save & Complete Profile"}</button>
        </div>
      )}
    </div>
  );
}
