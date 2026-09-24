import { AGENTS } from "@/lib/agents";
import type { AgentId } from "@/lib/types";

const FACE: Record<string, { bg: string; accent: string; hair: string }> = {
  ansioso: { bg: "#3a1a14", accent: "#ff4d2e", hair: "#1a0a08" },
  dramatica: { bg: "#3a1428", accent: "#ff3d8a", hair: "#2a0818" },
  tryhard: { bg: "#142038", accent: "#4d8bff", hair: "#0a1428" },
  meme: { bg: "#14301c", accent: "#22c55e", hair: "#0a2010" },
  casero: { bg: "#302814", accent: "#f5c542", hair: "#1a1608" },
  vos: { bg: "#221838", accent: "#e8e0ff", hair: "#140c28" },
};

export function Portrait({
  agent,
  size = 72,
  live = false,
  label,
}: {
  agent: AgentId;
  size?: number;
  live?: boolean;
  label?: string;
}) {
  const profile = AGENTS[agent];
  const face = FACE[agent] ?? FACE.vos;
  const id = `p-${agent}-${size}`;

  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size }}>
      <div
        className="portrait-ring relative"
        style={{ ["--ring" as string]: profile.color, width: size, height: size }}
      >
        <svg
          viewBox="0 0 80 80"
          width={size - 6}
          height={size - 6}
          className="block rounded-full"
          role="img"
          aria-label={label ?? profile.aka}
        >
          <defs>
            <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={face.accent} stopOpacity="0.9" />
              <stop offset="100%" stopColor={face.bg} />
            </linearGradient>
          </defs>
          <circle cx="40" cy="40" r="40" fill={`url(#${id}-g)`} />
          <ellipse cx="40" cy="22" rx="26" ry="14" fill={face.hair} opacity="0.85" />
          <circle cx="40" cy="38" r="18" fill="#f6d7c3" />
          <circle cx="33" cy="36" r="2.2" fill="#1a1220" />
          <circle cx="47" cy="36" r="2.2" fill="#1a1220" />
          <path d="M34 46 Q40 51 46 46" fill="none" stroke="#8b4a3a" strokeWidth="2" strokeLinecap="round" />
          <text x="40" y="68" textAnchor="middle" fontSize="16">
            {profile.emoji}
          </text>
        </svg>
        {live ? (
          <span className="absolute -top-1 -right-1 flex items-center gap-1 rounded-full bg-[#ff1a3c] px-1.5 py-0.5 text-[9px] font-bold text-white">
            <span className="rec" /> REC
          </span>
        ) : null}
      </div>
    </div>
  );
}
