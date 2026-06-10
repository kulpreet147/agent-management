import { useState } from "react";
import { Shield, Smartphone, History, KeyRound, Lock } from "lucide-react";
import { useToast } from "../../../hooks/useToast.js";
import { changeAgentPassword } from "../../../utils/agents.js";
import { css } from "./profileStyles.js";
import { Field, Toggle, SectionActions } from "./profileWidgets.jsx";

const TIMEZONES = [
  "America/Vancouver", "America/Edmonton", "America/Winnipeg", "America/Toronto",
  "America/Halifax", "America/St_Johns", "UTC",
];

const passwordRules = [
  { test: (v) => v.length >= 8, label: "At least 8 characters" },
  { test: (v) => /[A-Z]/.test(v), label: "One uppercase letter" },
  { test: (v) => /\d/.test(v), label: "One number" },
  { test: (v) => /[^A-Za-z0-9]/.test(v), label: "One special character" },
];

function ScaffoldCard({ icon, title, description }) {
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div style={{ width: 34, height: 34, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>{title}</div>
          <span style={css.badge("#f1f5f9", "#64748b", "#cbd5e1")}>Coming soon</span>
        </div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{description}</div>
      </div>
    </div>
  );
}

export default function SystemSettingsSection({ ctx, agentId, agentEmail }) {
  const toast = useToast();
  const { draft, update, editing, canEdit, saving, onEdit, onDiscard, onSave } = ctx;
  const settings = draft.settings;
  const notif = settings.notifications;
  const ro = !editing;

  const setSettings = (patch) => update((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  const setNotif = (channel, patch) =>
    update((d) => ({ ...d, settings: { ...d.settings, notifications: { ...d.settings.notifications, [channel]: { ...d.settings.notifications[channel], ...patch } } } }));

  // Toggling a channel off clears its sub-preferences.
  const toggleEmail = (on) => setNotif("email", on ? { enabled: true } : { enabled: false, marketing: false, transactional: false });
  const toggleSms = (on) => setNotif("sms", { enabled: on });
  const toggleWhatsapp = (on) => setNotif("whatsapp", { enabled: on });

  // --- Password change (independent of the profile save flow) --------------
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwdSaving, setPwdSaving] = useState(false);
  const newPwdValid = passwordRules.every((r) => r.test(pwd.newPassword));
  const confirmValid = pwd.confirmPassword === pwd.newPassword;

  const submitPassword = async () => {
    if (!agentId) return;
    if (!pwd.currentPassword) return toast.error("Enter your current password.");
    if (!newPwdValid) return toast.error("New password does not meet the requirements.");
    if (!confirmValid) return toast.error("New password and confirmation do not match.");
    setPwdSaving(true);
    try {
      await changeAgentPassword(agentId, { currentPassword: pwd.currentPassword, newPassword: pwd.newPassword });
      toast.success("Password changed successfully.");
      setPwd({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error.message || "Unable to change password.");
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <div>
      {/* Notification Preferences + Timezone (profile-backed) */}
      <div style={css.panel}>
        <div style={css.sectionHeader}>
          <div>
            <div style={css.panelTitle}>Notification Preferences</div>
            <div style={css.panelSub}>Choose how you'd like to hear from us.</div>
          </div>
          <SectionActions editing={editing} canEdit={canEdit} onEdit={onEdit} onSave={onSave} onDiscard={onDiscard} saving={saving} />
        </div>

        <div style={css.toggleRow}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Email Notifications</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Receive updates by email.</div>
          </div>
          <Toggle value={notif.email.enabled} disabled={ro} onChange={toggleEmail} />
        </div>
        {notif.email.enabled && (
          <div style={{ paddingLeft: 8, marginTop: 4 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", fontSize: 13, cursor: ro ? "default" : "pointer", opacity: ro ? 0.6 : 1 }}>
              <input type="checkbox" disabled={ro} checked={!!notif.email.transactional} onChange={(e) => setNotif("email", { transactional: e.target.checked })} style={{ accentColor: "#2563eb" }} />
              Account & transactional emails
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", fontSize: 13, cursor: ro ? "default" : "pointer", opacity: ro ? 0.6 : 1 }}>
              <input type="checkbox" disabled={ro} checked={!!notif.email.marketing} onChange={(e) => setNotif("email", { marketing: e.target.checked })} style={{ accentColor: "#2563eb" }} />
              Marketing & product updates
            </label>
          </div>
        )}

        <div style={css.toggleRow}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>SMS Notifications</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Text alerts to your phone.</div>
          </div>
          <Toggle value={notif.sms.enabled} disabled={ro} onChange={toggleSms} />
        </div>

        <div style={{ ...css.toggleRow, borderBottom: "none" }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>WhatsApp Notifications</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Messages via WhatsApp (if available).</div>
          </div>
          <Toggle value={notif.whatsapp.enabled} disabled={ro} onChange={toggleWhatsapp} />
        </div>

        <div style={{ marginTop: 16, maxWidth: 280 }}>
          <Field label="Time Zone">
            <select style={{ ...css.select, ...(ro ? css.inputReadonly : {}) }} disabled={ro} value={settings.timezone || "America/Toronto"} onChange={(e) => setSettings({ timezone: e.target.value })}>
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz.replace("_", " ")}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* Security & Login */}
      <div style={css.panel}>
        <div style={css.panelTitle}><Shield size={16} /> Security &amp; Login</div>
        <div style={css.panelSub}>Manage how you sign in to your account.</div>

        <div style={{ ...css.formGrid(2), marginBottom: 18 }}>
          <Field label="Username">
            <input style={{ ...css.input, ...css.inputReadonly }} disabled value={agentEmail} readOnly />
          </Field>
        </div>

        {/* Password Management — functional */}
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <KeyRound size={15} color="#2563eb" />
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>Password Management</div>
          </div>
          <div style={css.formGrid(3)}>
            <Field label="Current Password">
              <input type="password" style={css.input} autoComplete="current-password" value={pwd.currentPassword} onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))} />
            </Field>
            <Field label="New Password" error={pwd.newPassword && !newPwdValid ? "Does not meet requirements." : ""}>
              <input type="password" style={{ ...css.input, ...(pwd.newPassword && !newPwdValid ? css.inputError : {}) }} autoComplete="new-password" value={pwd.newPassword} onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))} />
            </Field>
            <Field label="Confirm New Password" error={pwd.confirmPassword && !confirmValid ? "Passwords do not match." : ""}>
              <input type="password" style={{ ...css.input, ...(pwd.confirmPassword && !confirmValid ? css.inputError : {}) }} autoComplete="new-password" value={pwd.confirmPassword} onChange={(e) => setPwd((p) => ({ ...p, confirmPassword: e.target.value }))} />
            </Field>
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", margin: "10px 0 4px" }}>
            {passwordRules.map((r) => (
              <span key={r.label} style={{ fontSize: 11, color: pwd.newPassword && r.test(pwd.newPassword) ? "#16a34a" : "#94a3b8" }}>
                {pwd.newPassword && r.test(pwd.newPassword) ? "✓" : "•"} {r.label}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="button" style={css.btnPrimary} disabled={pwdSaving} onClick={submitPassword}>{pwdSaving ? "Updating…" : "Update Password"}</button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <ScaffoldCard icon={<Lock size={16} />} title="Multi-Factor Authentication (MFA)" description="Add an extra layer of security with an authenticator app. Setup will be available soon." />
          <ScaffoldCard icon={<History size={16} />} title="Login History" description="A record of recent sign-ins will appear here once tracking is enabled." />
          <ScaffoldCard icon={<Smartphone size={16} />} title="Device History" description="Devices that have accessed your account will be listed here." />
        </div>
      </div>

      {editing && (
        <div style={css.saveBar}>
          <span style={{ fontSize: 13 }}>You're editing your Notification settings. Save or discard to continue.</span>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" style={css.btnSecondary} onClick={onDiscard} disabled={saving}>Discard</button>
            <button type="button" style={css.btnSuccess} onClick={onSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
