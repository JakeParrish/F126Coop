import { useEffect, useState } from "react";
import { readableText } from "../lib/ui";

interface Props {
  name: string;
  code: string;
  teamColor: string;
  imageUrl?: string | null;
  size?: number; // pixels
  className?: string;
  objectPosition?: string; // crop focus; defaults to faces (upper portion)
  useConvention?: boolean; // try /drivers/<CODE>.png when no imageUrl (real drivers only)
}

// A driver headshot. Resolves an image in priority order:
//   1. an explicit imageUrl, else
//   2. a repo file at /drivers/<CODE>.png (drop headshots there), else
//   3. a team-coloured monogram fallback (on image load error).
export default function Avatar({
  name,
  code,
  teamColor,
  imageUrl,
  size = 40,
  className = "",
  objectPosition = "50% 2%",
  useConvention = true,
}: Props) {
  const explicit = imageUrl && imageUrl.trim() ? imageUrl.trim() : null;
  const src = explicit || (useConvention ? `/drivers/${code.toUpperCase()}.png` : null);
  const [failed, setFailed] = useState(false);

  // Reset the error state if the resolved image source changes.
  useEffect(() => setFailed(false), [src]);

  const dim = { width: size, height: size, minWidth: size };

  if (failed || !src) {
    return (
      <div
        style={{ ...dim, background: teamColor, color: readableText(teamColor) }}
        className={`rounded-full flex items-center justify-center font-extrabold leading-none ${className}`}
        title={name}
      >
        <span style={{ fontSize: size * 0.3 }}>{code.toUpperCase().slice(0, 3)}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      title={name}
      onError={() => setFailed(true)}
      style={{ ...dim, borderColor: teamColor, objectPosition }}
      className={`rounded-full object-cover bg-f1-panel border-2 ${className}`}
    />
  );
}
