import { useEffect, useState } from "react";
import Avatar from "./Avatar";

interface Props {
  name: string;
  code: string;
  teamColor: string;
  imageUrl?: string | null;
  height?: number;
  className?: string;
}

// A full (non-circular) driver headshot, falling back to a monogram on error.
export default function DriverPortrait({
  name,
  code,
  teamColor,
  imageUrl,
  height = 120,
  className = "",
}: Props) {
  const src = (imageUrl && imageUrl.trim()) || `/drivers/${code.toUpperCase()}.png`;
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (failed) {
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
