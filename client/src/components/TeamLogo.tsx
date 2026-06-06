import { useEffect, useState } from "react";
import TeamBadge from "./TeamBadge";

// Slug used for the logo filename, e.g. "Red Bull" -> "red-bull".
export function teamSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface Props {
  name: string;
  color: string;
  size?: number; // logo height in px
  className?: string;
}

// Shows a team logo from /teams/<slug>.png if present, else the colour badge.
export default function TeamLogo({ name, color, size = 22, className = "" }: Props) {
  const src = `/teams/${teamSlug(name)}.png`;
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  if (failed) return <TeamBadge name={name} color={color} className={className} />;

  return (
    <img
      src={src}
      alt={name}
      title={name}
      onError={() => setFailed(true)}
      style={{ height: size, maxWidth: size * 4 }}
      className={`object-contain ${className}`}
    />
  );
}
