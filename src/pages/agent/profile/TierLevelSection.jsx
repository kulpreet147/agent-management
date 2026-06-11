import { useState } from "react";
import { Check } from "lucide-react";
import { useToast } from "../../../hooks/useToast.js";
import { requestTierUpgrade } from "../../../utils/agents.js";
import { confirmDialog } from "../../../utils/confirmDialog.js";
import { css, tierMeta } from "./profileStyles.js";

const TIER_FEATURES = {
  "Free Trial": ["Basic profile", "Up to 10 leads", "Email support"],
  Silver: ["Unlimited leads", "Business card generation", "Standard analytics", "Email & chat support"],
  Gold: ["Everything in Silver", "Social media kit", "Advanced analytics", "Priority support"],
  Platinum: ["Everything in Gold", "Dedicated account manager", "Custom branding", "API access"],
};

function TierBadge({ tier }) {
  const meta = tierMeta[tier] || tierMeta.Silver;
  return <span style={css.badge(meta.style.background, meta.style.color, meta.style.borderColor)}>{meta.icon} {tier}</span>;
}

export default function TierLevelSection({ agentId, tierInfo, onRefresh, locked }) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const { subscriptionTier, tierRequest, availableTiers } = tierInfo;

  const tiers = availableTiers && availableTiers.length ? availableTiers : ["Free Trial", "Silver", "Gold", "Platinum"];
  const currentRank = tiers.indexOf(subscriptionTier);
  const upgrades = tiers.filter((t, i) => i > currentRank);
  const pending = tierRequest && tierRequest.status === "pending";

  const submit = async (tier) => {
    if (!agentId || submitting) return;
    const ok = await confirmDialog({
      title: "Request tier upgrade",
      message: `Submit a request to upgrade to ${tier}? An administrator will review it for approval.`,
      confirmText: "Submit request",
    });
    if (!ok) return;
    setSubmitting(true);
    try {
      await requestTierUpgrade(agentId, tier);
      toast.success(`Upgrade to ${tier} submitted for approval.`);
      await onRefresh(false);
    } catch (error) {
      toast.error(error.message || "Unable to submit upgrade request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {locked && (
        <div style={{ ...css.emptyState, marginBottom: 16, borderStyle: "solid", borderColor: "#fcd34d", background: "#fffbeb", color: "#92400e" }}>
          Finish or discard your edits in the other section before requesting a tier change.
        </div>
      )}

      <div style={css.panel}>
        <div style={css.sectionHeader}>
          <div>
            <div style={css.panelTitle}>Membership Tier</div>
            <div style={css.panelSub}>Your current plan and available upgrades.</div>
          </div>
          <TierBadge tier={subscriptionTier} />
        </div>

        <div style={{ display: "flex", gap: 32, flexWrap: "wrap", marginBottom: 8 }}>
          <div>
            <div style={css.label}>Current Tier</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>{subscriptionTier}</div>
          </div>
          <div>
            <div style={css.label}>Renewal Date</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 8, color: "#475569" }}>
              {tierRequest?.status === "approved" && tierRequest?.decidedAt
                ? new Date(tierRequest.decidedAt).toLocaleDateString()
                : "—"}
            </div>
          </div>
          <div>
            <div style={css.label}>Upgrade Status</div>
            <div style={{ marginTop: 6 }}>
              {pending ? (
                <span style={css.badge("#fffbeb", "#b45309", "#fcd34d")}>⏳ Pending: {tierRequest.requestedTier}</span>
              ) : tierRequest?.status === "approved" ? (
                <span style={css.badge("#f0fdf4", "#15803d", "#bbf7d0")}>✓ Approved</span>
              ) : tierRequest?.status === "rejected" ? (
                <span style={css.badge("#fef2f2", "#b91c1c", "#fecaca")}>✕ Declined</span>
              ) : (
                <span style={{ fontSize: 13, color: "#94a3b8" }}>No requests</span>
              )}
            </div>
          </div>
        </div>

        {tierRequest?.status === "rejected" && tierRequest?.note && (
          <div style={{ fontSize: 12.5, color: "#b91c1c", marginTop: 8 }}>Reviewer note: {tierRequest.note}</div>
        )}
      </div>

      <div style={css.panel}>
        <div style={css.panelTitle}>Plan Comparison</div>
        <div style={css.panelSub}>A snapshot of what each tier includes — request an upgrade for higher tiers only.</div>

        <div style={css.tierGrid}>
          {tiers.map((tier, i) => {
            const isCurrent = tier === subscriptionTier;
            const isUpgrade = i > currentRank;
            const meta = tierMeta[tier] || tierMeta.Silver;
            return (
              <div key={tier} style={css.tierCard(isCurrent, isUpgrade)}>
                <div style={css.tierName}>
                  <span>{meta.icon}</span> {tier}
                </div>
                {isCurrent && <span style={css.badge("#eff6ff", "#1d4ed8", "#bfdbfe")}>Current Plan</span>}
                <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 4 }}>
                  {(TIER_FEATURES[tier] || []).map((f) => (
                    <div key={f} style={css.featureRow}>
                      <Check size={14} color="#16a34a" /> {f}
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1 }} />
                {isUpgrade && (
                  <button
                    type="button"
                    style={{ ...css.btnPrimary, marginTop: 8, opacity: pending || locked ? 0.5 : 1, cursor: pending || locked ? "not-allowed" : "pointer" }}
                    disabled={pending || locked || submitting}
                    onClick={() => submit(tier)}
                  >
                    {pending && tierRequest.requestedTier === tier ? "Pending approval" : "Request Upgrade"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
