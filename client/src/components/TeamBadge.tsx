import { readableText } from "../lib/ui";

interface Props {
  name: string;
  color: string;
  className?: string;
}

// A team-coloured pill — the closest we can get to a logo without licensed art.
export default function TeamBadge({ name, color, className = "" }: Props) {
  return (
    <span
      style={{ background: color, color: readableText(color) }}
      className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${className}`}
    >
      {name}
    </span>
  );
}
