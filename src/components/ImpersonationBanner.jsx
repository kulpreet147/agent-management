import { useEffect, useState } from "react";
import { auth } from "../utils/auth.js";

// Fixed-height banner (44px) shown across the agent portal while an admin is
// acting on behalf of an agent. While active it adds `impersonating` to <body>
// so the global CSS shrinks the agent's h-screen layout to fit below it.
export default function ImpersonationBanner() {
  const [exiting, setExiting] = useState(false);
  const session = auth.get();
  const isImpersonating = Boolean(session?.impersonatedBy);

  useEffect(() => {
    document.body.classList.toggle("impersonating", isImpersonating);
    return () => document.body.classList.remove("impersonating");
  }, [isImpersonating]);

  if (!isImpersonating) return null;

  const adminName = session.impersonatedBy.name || "Admin";

  const exit = async () => {
    if (exiting) return;
    setExiting(true);
    try {
      await auth.stopImpersonation();
    } finally {
      // Full reload guarantees the restored admin session is read everywhere.
      window.location.href = "/admin/agents";
    }
  };

  return (
    <div
      style={{
        position: "relative",
        zIndex: 1000,
        height: 44,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        flexWrap: "nowrap",
        background: "linear-gradient(90deg, #b45309, #d97706)",
        color: "#fff",
        padding: "0 16px",
        fontSize: 13,
        fontWeight: 600,
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
      }}
    >
      <span>
        👤 Acting on behalf of <strong>{session.name}</strong> · delegated by {adminName}
      </span>
      <button
        type="button"
        onClick={exit}
        disabled={exiting}
        style={{
          background: "#fff",
          color: "#b45309",
          border: "none",
          borderRadius: 6,
          padding: "4px 12px",
          fontSize: 12.5,
          fontWeight: 700,
          cursor: exiting ? "default" : "pointer",
          opacity: exiting ? 0.7 : 1,
        }}
      >
        {exiting ? "Returning…" : "Return to admin"}
      </button>
    </div>
  );
}
