import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "../../hooks/useToast.js";
import { auth } from "../../utils/auth.js";
import AgentSidebar from "../../components/AgentSidebar.jsx";
import CommonHeader from "../../components/CommonHeader.jsx";
import { getAgent, getAgentProfile, getAgentSecurityHistory, updateAgentProfile } from "../../utils/agents.js";
import { confirmDialog } from "../../utils/confirmDialog.js";
import { css } from "./profile/profileStyles.js";
import { formatUsCaPhone } from "./profile/profileValidation.js";
import TierLevelSection from "./profile/TierLevelSection.jsx";
import PersonalProfileSection from "./profile/PersonalProfileSection.jsx";
import BusinessProfileSection from "./profile/BusinessProfileSection.jsx";
import OnlineProfileSection from "./profile/OnlineProfileSection.jsx";
import SystemSettingsSection from "./profile/SystemSettingsSection.jsx";
import LicensingSection from "./profile/LicensingSection.jsx";

const TABS = ["Tier Level", "Personal Profile", "Business Profile", "Licensing", "Online Profile", "System Settings"];

function resolveMediaUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:3000/api";
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

const arr = (v) => (Array.isArray(v) ? v : []);
const clone = (v) => JSON.parse(JSON.stringify(v));

const DEFAULT_PROFILE = {
  personal: {
    firstName: "", lastName: "", preferredName: "", dob: "", gender: "", maritalStatus: "",
    primaryPhone: "", secondaryPhone: "", hasSecondaryPhone: false, email: "",
    address: { unit: "", streetNumber: "", streetName: "", city: "", province: "", country: "Canada", postalCode: "" },
    emergencyContact: { name: "", phone: "", relationship: "" },
  },
  family: [],
  business: {
    operatingName: "", mailingAddress: "", businessPhone: "", businessEmail: "",
    yearsExperience: "", specializations: [], productsOffered: [], serviceAreas: [], languages: [],
    bio: "", designations: [], awards: [],
  },
  online: { linkedin: "", facebook: "", instagram: "", twitter: "", youtube: "", tiktok: "", website: "", otherProfiles: "", bookingLink: "" },
  settings: {
    notifications: {
      email: { enabled: true, marketing: false, transactional: true },
      sms: { enabled: false },
      whatsapp: { enabled: false },
    },
    timezone: "America/Toronto",
  },
};

function formatAddressLine(addr = {}) {
  return [addr.unit, [addr.streetNumber, addr.streetName].filter(Boolean).join(" "), addr.city, addr.province, addr.postalCode, addr.country]
    .map((p) => String(p || "").trim())
    .filter(Boolean)
    .join(", ");
}

// Build a full profile object from whatever the backend returned, layering in
// sensible defaults and seeding empty fields from the agent record.
function hydrateProfile(saved, agent) {
  const p = saved || {};
  const sp = p.personal || {};
  const nameParts = String(agent?.name || "").trim().split(/\s+/).filter(Boolean);

  const personal = {
    ...DEFAULT_PROFILE.personal,
    ...sp,
    firstName: sp.firstName || nameParts[0] || "",
    lastName: sp.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(" ") : ""),
    email: sp.email || agent?.email || "",
    primaryPhone: sp.primaryPhone || (agent?.phone ? formatUsCaPhone(agent.phone) : ""),
    hasSecondaryPhone: sp.hasSecondaryPhone ?? Boolean(sp.secondaryPhone),
    address: {
      ...DEFAULT_PROFILE.personal.address,
      ...(sp.address || {}),
      city: sp.address?.city || sp.city || "",
      postalCode: sp.address?.postalCode || sp.postalCode || "",
    },
    emergencyContact: { ...DEFAULT_PROFILE.personal.emergencyContact, ...(sp.emergencyContact || {}) },
  };

  const b = p.business || {};
  const business = {
    ...DEFAULT_PROFILE.business,
    ...b,
    specializations: arr(b.specializations),
    productsOffered: arr(b.productsOffered),
    serviceAreas: arr(b.serviceAreas),
    languages: arr(b.languages),
    designations: arr(b.designations),
    awards: arr(b.awards),
    operatingName: b.operatingName || [personal.firstName, personal.lastName].filter(Boolean).join(" "),
    businessEmail: b.businessEmail || personal.email,
    businessPhone: b.businessPhone || personal.primaryPhone,
    mailingAddress: b.mailingAddress || formatAddressLine(personal.address),
  };

  const s = p.settings || {};
  const n = s.notifications || {};
  const settings = {
    ...DEFAULT_PROFILE.settings,
    ...s,
    notifications: {
      email: { ...DEFAULT_PROFILE.settings.notifications.email, ...(n.email || {}) },
      sms: { ...DEFAULT_PROFILE.settings.notifications.sms, ...(n.sms || {}) },
      whatsapp: { ...DEFAULT_PROFILE.settings.notifications.whatsapp, ...(n.whatsapp || {}) },
    },
  };

  return { personal, family: arr(p.family), business, online: { ...DEFAULT_PROFILE.online, ...(p.online || {}) }, settings };
}

export default function AgentProfile() {
  const session = auth.get();
  const toast = useToast();

  const [agentData, setAgentData] = useState(null);
  const [company, setCompany] = useState(null);
  const [tierInfo, setTierInfo] = useState({ subscriptionTier: "Silver", tierRequest: null, availableTiers: [] });
  const [securityHistory, setSecurityHistory] = useState({ loginHistory: [], deviceHistory: [] });

  const [profile, setProfile] = useState(() => hydrateProfile(null, null)); // saved snapshot
  const [draft, setDraft] = useState(() => hydrateProfile(null, null)); // working copy
  const [editingTab, setEditingTab] = useState(null);
  const [activeTab, setActiveTab] = useState("Tier Level");
  const [saving, setSaving] = useState(false);

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const savedAvatarPreview = useRef("");

  const agentName = agentData?.name || session?.name || "Agent";
  const agentEmail = agentData?.email || session?.email || "";
  const initials = agentName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(profile) || Boolean(avatarFile),
    [draft, profile, avatarFile]
  );

  const loadProfile = (showError = true) => {
    if (!session?.id) return Promise.resolve();
    return Promise.all([
      getAgent(session.id),
      getAgentProfile(session.id),
      getAgentSecurityHistory(session.id).catch(() => ({ loginHistory: [], deviceHistory: [] })),
    ])
      .then(([agent, data, security]) => {
        setAgentData(agent || null);
        if (data?.company) setCompany(data.company);
        setTierInfo({
          subscriptionTier: data?.subscriptionTier || agent?.subscriptionTier || "Silver",
          tierRequest: data?.tierRequest || agent?.documents?.tierRequest || null,
          availableTiers: data?.availableTiers || ["Free Trial", "Silver", "Gold", "Platinum"],
        });
        const hydrated = hydrateProfile(data?.profile || data || {}, agent);
        setProfile(hydrated);
        setDraft(clone(hydrated));
        const avatarUrl = data?.avatarUrl || readAvatarPathFromAgent(data) || readAvatarPathFromAgent(agent);
        const resolved = avatarUrl ? resolveMediaUrl(`${avatarUrl}?t=${Date.now()}`) : "";
        savedAvatarPreview.current = resolved;
        setAvatarPreview(resolved);
        setSecurityHistory({
          loginHistory: Array.isArray(security?.loginHistory) ? security.loginHistory : [],
          deviceHistory: Array.isArray(security?.deviceHistory) ? security.deviceHistory : [],
        });
      })
      .catch((err) => {
        if (showError) toast.error(err.message || "Unable to load profile.");
      });
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  // --- Edit-lock + dirty guard --------------------------------------------
  const requestTab = async (tab) => {
    if (tab === activeTab) return;
    if (editingTab) {
      if (isDirty) {
        const ok = await confirmDialog({
          title: "Discard unsaved changes?",
          message: "You have unsaved changes in this section. Discard them and switch sections?",
          confirmText: "Discard & switch",
          variant: "danger",
        });
        if (!ok) return;
      }
      resetEdit();
    }
    setActiveTab(tab);
  };

  const resetEdit = () => {
    setDraft(clone(profile));
    setEditingTab(null);
    setAvatarFile(null);
    setAvatarPreview(savedAvatarPreview.current);
  };

  const beginEdit = (tab) => {
    if (editingTab && editingTab !== tab) return; // single-section lock
    setDraft(clone(profile));
    setEditingTab(tab);
  };

  // Mirror nested address city/postal to the flat fields the backend uses to
  // detect registration completion, and keep the current tier in settings.
  const buildSavePayload = (working) => {
    const p = clone(working);
    p.personal = p.personal || {};
    p.personal.city = p.personal.address?.city || "";
    p.personal.postalCode = p.personal.address?.postalCode || "";
    p.settings = p.settings || {};
    p.settings.subscriptionTier = tierInfo.subscriptionTier;
    return p;
  };

  const saveProfile = async () => {
    if (!session?.id) return;
    setSaving(true);
    try {
      const payload = buildSavePayload(draft);
      const formData = new FormData();
      formData.append("profile", JSON.stringify(payload));
      if (avatarFile) formData.append("avatar", avatarFile);
      const updated = await updateAgentProfile(session.id, formData);

      const nextProfile = hydrateProfile(updated?.profile || payload, updated?.agent || agentData);
      setProfile(nextProfile);
      setDraft(clone(nextProfile));
      if (updated?.agent) setAgentData(updated.agent);

      const nextAvatarUrl = updated?.avatarUrl || readAvatarPathFromAgent(updated?.agent);
      const resolved = nextAvatarUrl ? resolveMediaUrl(`${nextAvatarUrl}?t=${Date.now()}`) : savedAvatarPreview.current;
      savedAvatarPreview.current = resolved;
      setAvatarPreview(resolved);
      setAvatarFile(null);
      setEditingTab(null);
      toast.success("Profile updated successfully.");
    } catch (error) {
      toast.error(error.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const sectionCtx = (tabId) => ({
    draft,
    update: setDraft,
    profile,
    agentData,
    company,
    editing: editingTab === tabId,
    canEdit: editingTab === null,
    saving,
    onEdit: () => beginEdit(tabId),
    onDiscard: resetEdit,
    onSave: saveProfile,
  });

  return (
    <div className="min-h-screen bg-[#0f1117]">
      <div className="flex h-screen overflow-hidden">
        <AgentSidebar agentName={agentName} initials={initials} />
        <div style={{ ...css.page, flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <CommonHeader title="My Profile" compact />
          <div style={{ ...css.main, height: "auto", minHeight: 0 }}>
            <div style={css.pageHeader}>
              <div>
                <div style={css.pageTitle}>My Profile</div>
                <div style={css.pageSub}>
                  Only you can edit this. {editingTab ? `Editing: ${editingTab}.` : "Pick a section and choose Edit to make changes."}
                </div>
              </div>
            </div>

            <div style={css.tabsBar}>
              {TABS.map((tab) => (
                <div
                  key={tab}
                  style={{
                    ...css.tab(activeTab === tab),
                    ...(editingTab && editingTab !== tab ? { opacity: 0.55 } : {}),
                  }}
                  onClick={() => requestTab(tab)}
                  title={editingTab && editingTab !== tab ? "Finish or discard your current edits first" : ""}
                >
                  {tab}
                  {editingTab === tab && <span style={{ color: "#f59e0b", marginLeft: 6 }}>●</span>}
                </div>
              ))}
            </div>

            <div style={css.content}>
              {activeTab === "Tier Level" && (
                <TierLevelSection
                  agentId={session?.id}
                  tierInfo={tierInfo}
                  onRefresh={loadProfile}
                  locked={Boolean(editingTab)}
                />
              )}
              {activeTab === "Personal Profile" && (
                <PersonalProfileSection
                  ctx={sectionCtx("Personal Profile")}
                  agentName={agentName}
                  agentEmail={agentEmail}
                  tier={tierInfo.subscriptionTier}
                  avatarPreview={avatarPreview}
                  setAvatarPreview={setAvatarPreview}
                  setAvatarFile={setAvatarFile}
                />
              )}
              {activeTab === "Business Profile" && (
                <BusinessProfileSection ctx={sectionCtx("Business Profile")} />
              )}
              {activeTab === "Licensing" && (
                <LicensingSection agentData={agentData} />
              )}
              {activeTab === "Online Profile" && (
                <OnlineProfileSection ctx={sectionCtx("Online Profile")} />
              )}
              {activeTab === "System Settings" && (
                <SystemSettingsSection
                  ctx={sectionCtx("System Settings")}
                  agentId={session?.id}
                  agentEmail={agentEmail}
                  securityHistory={securityHistory}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
