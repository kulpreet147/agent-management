import { useState } from "react";
import { Shield, Smartphone, History, KeyRound, Lock, ChevronDown, MapPin } from "lucide-react";
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

function StatusTag({ label }) {
  return (
    <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3, color: "#b45309", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 999, padding: "2px 8px" }}>
      {label}
    </span>
  );
}

function InfoCard({ icon, title, description, children, collapsible = false, defaultOpen = false, count, tag }) {
  const [open, setOpen] = useState(defaultOpen);
  const isCollapsible = collapsible && Boolean(children);
  const showBody = !isCollapsible || open;
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div style={{ width: 34, height: 34, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, cursor: isCollapsible ? "pointer" : "default", userSelect: "none" }}
          onClick={isCollapsible ? () => setOpen((o) => !o) : undefined}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>{title}</div>
              {typeof count === "number" && count > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#1d4ed8", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 999, padding: "1px 8px" }}>{count}</span>
              )}
              {tag && <StatusTag label={tag} />}
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{description}</div>
          </div>
          {isCollapsible && (
            <ChevronDown size={18} style={{ color: "#94a3b8", flexShrink: 0, transition: "transform 0.2s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
          )}
        </div>
        {showBody && children ? <div style={{ marginTop: 12 }}>{children}</div> : null}
      </div>
    </div>
  );
}

function fmtDate(value) {
  if (!value) return "Still active";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

function fmtLocation(location) {
  if (!location) return "Location unavailable";
  if (location.isPrivate) return "Local network";
  return location.label || "Unknown location";
}

function EmptyState({ message }) {
  return <div style={{ fontSize: 12, color: "#94a3b8" }}>{message}</div>;
}

export default function SystemSettingsSection({ ctx, agentId, agentEmail, securityHistory }) {
  const toast = useToast();
  const { draft, update, editing, canEdit, saving, onEdit, onDiscard, onSave } = ctx;
  const settings = draft.settings;
  const notif = settings.notifications;
  const ro = !editing;
  const loginHistory = Array.isArray(securityHistory?.loginHistory) ? securityHistory.loginHistory : [];
  const deviceHistory = Array.isArray(securityHistory?.deviceHistory) ? securityHistory.deviceHistory : [];

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

        <div style={css.toggleRow}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>SMS Notifications</div>
              <StatusTag label="Under Implementation" />
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Text alerts to your phone.</div>
          </div>
          <Toggle value={notif.sms.enabled} disabled onChange={toggleSms} />
        </div>

        <div style={{ ...css.toggleRow, borderBottom: "none" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>WhatsApp Notifications</div>
              <StatusTag label="Under Implementation" />
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Messages via WhatsApp (if available).</div>
          </div>
          <Toggle value={notif.whatsapp.enabled} disabled onChange={toggleWhatsapp} />
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
          <InfoCard icon={<Lock size={16} />} title="Multi-Factor Authentication (MFA)" tag="Under Implementation" description="Add an extra layer of security with an authenticator app. Setup will be available soon." />
          <InfoCard icon={<History size={16} />} title="Login History" description="Recent sign-in sessions for this agent account." collapsible count={loginHistory.length}>
            {loginHistory.length === 0 ? (
              <EmptyState message="No login history recorded yet." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {loginHistory.slice(0, 8).map((entry) => (
                  <div key={entry.id} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, background: "#f8fafc" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{entry.deviceName || "Unknown device"}</div>
                      <span style={css.badge("#eff6ff", "#1d4ed8", "#bfdbfe")}>{entry.ipAddress || "IP unavailable"}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 6 }}>
                      Login: {fmtDate(entry.loginAt)}
                    </div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                      Logout: {fmtDate(entry.logoutAt)}
                    </div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 4, display: "flex", alignItems: "center", gap: 5 }}>
                      <MapPin size={12} color="#94a3b8" /> {fmtLocation(entry.location)}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
                      {entry.operatingSystem || "Unknown OS"} · {entry.browser || "Unknown Browser"} · {entry.deviceType || "Unknown"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </InfoCard>
          <InfoCard icon={<Smartphone size={16} />} title="Device History" description="Devices that have accessed this account." collapsible count={deviceHistory.length}>
            {deviceHistory.length === 0 ? (
              <EmptyState message="No device history recorded yet." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {deviceHistory.slice(0, 8).map((device) => (
                  <div key={device.fingerprint} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, background: "#f8fafc" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{device.deviceName || "Unknown device"}</div>
                      <span style={css.badge("#f0fdf4", "#166534", "#bbf7d0")}>{device.loginCount || 0} login{device.loginCount === 1 ? "" : "s"}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 6 }}>
                      Last seen: {fmtDate(device.lastSeenAt)}
                    </div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                      First seen: {fmtDate(device.firstSeenAt)}
                    </div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 4, display: "flex", alignItems: "center", gap: 5 }}>
                      <MapPin size={12} color="#94a3b8" /> {fmtLocation(device.location)}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
                      {device.operatingSystem || "Unknown OS"} · {device.browser || "Unknown Browser"} · {device.deviceType || "Unknown"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </InfoCard>
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
