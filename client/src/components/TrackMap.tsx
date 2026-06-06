import { CIRCUITS, circuitForRound } from "../data/circuits";

interface Props {
  round?: number;
  circuitId?: string;
  color?: string;
  className?: string;
  strokeWidth?: number;
}

// Renders a circuit outline as an SVG path. Looks the circuit up by round
// (default) or by explicit circuitId. Renders nothing if unknown.
export default function TrackMap({
  round,
  circuitId,
  color = "#E10600",
  className,
  strokeWidth = 16,
}: Props) {
  const circuit = circuitId ? CIRCUITS[circuitId] : round != null ? circuitForRound(round) : null;
  if (!circuit) return null;
  return (
    <svg
      viewBox={circuit.viewBox}
      className={className}
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`${circuit.name} layout`}
    >
      <path
        d={circuit.d}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
