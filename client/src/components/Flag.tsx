interface Props {
  iso: string | null; // ISO 3166-1 alpha-2, e.g. "gb"
  className?: string; // size via height utility, e.g. "h-4"
}

// Flag image (works on Windows, unlike emoji flags). Served from flagcdn.
export default function Flag({ iso, className = "h-4" }: Props) {
  if (!iso) return <span className={className}>🏁</span>;
  return (
    <img
      src={`https://flagcdn.com/${iso}.svg`}
      alt={iso.toUpperCase()}
      className={`inline-block w-auto align-middle rounded-sm object-cover ${className}`}
    />
  );
}
