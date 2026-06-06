import { useEffect, useState } from "react";
import Avatar from "./Avatar";

interface Props {
  name: string;
  code: string;
  teamColor: string;
  imageUrl?: string | null;
  height?: number;
  className?: string;
  useConvention?: boolean;
}

// A full (non-circular) driver headshot, falling back to a monogram on error.
export default function DriverPortrait({
  name,
  code,
  teamColor,
  imageUrl,
  height = 120,
  className = "",
  useConvention = true,
}: Props) {
  const explicit = imageUrl && imageUrl.trim() ? imageUrl.trim() : null;
  const src = explicit || (useConvention ? `/drivers/${code.toUpperCase()}.png` : null);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (failed || !src) {
    return (
      <span className={className}>
        <Avatar name={name} code={code} teamColor={teamColor} imageUrl={null} size={height * 0.66} />
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      onError={() => setFailed(true)}
      style={{ height }}
      className={`w-auto object-contain object-bottom ${className}`}
    />
  );
}
