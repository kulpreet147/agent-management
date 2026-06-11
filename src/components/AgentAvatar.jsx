import { getAgentAvatarUrl, getInitials, gradientForName } from "../utils/avatar.js";

// Renders an agent's profile picture when available, otherwise a deterministic
// gradient circle with the agent's initials. If the image fails to load it
// gracefully falls back to the initials underneath.
export default function AgentAvatar({ agent, name, size = 44, className = "" }) {
  const displayName = name || agent?.name || "";
  const url = getAgentAvatarUrl(agent);
  const initials = getInitials(displayName);

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold text-white ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.36),
        background: gradientForName(displayName),
      }}
    >
      {initials}
      {url && (
        <img
          src={url}
          alt={displayName ? `${displayName} profile` : "profile"}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}
    </span>
  );
}
