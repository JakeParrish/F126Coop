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
  circle?: boolean; // render a circular avatar (custom drivers) instead of a tall headshot
}

// A driver headshot. Real drivers render as a tall cut-out; custom drivers
// render as a circular avatar (their Discord PFP, or a monogram if unclaimed).
export default function DriverPortrait({
  name,
  code,
  teamColor,
  imageUrl,
  height = 120,
  className = "",
  useConvention = true,
  circle = false,
}: Props) {
  const explicit = imageUrl && imageUrl.trim() ? imageUrl.trim() : null;
  const src = explicit || (useConvention ? `/drivers/${code.toUpperCase()}.png` : null);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  // Custom drivers: a circular avatar (PFP/monogram) sized like the monogram.
  if (circle) {
    return (
      <span className={className}>
        <Avatar
          name={name}
          code={code}
          teamColor={teamColor}
          imageUrl={imageUrl}
          useConvention={useConvention}
          size={height * 0.66}
        />
      </span>
    );
  }

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
