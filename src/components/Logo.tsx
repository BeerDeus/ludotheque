export default function Logo({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#4f46e5" />
      <rect x="14" y="14" width="36" height="36" rx="8" fill="#fff" />
      <circle cx="24" cy="24" r="4" fill="#4f46e5" />
      <circle cx="40" cy="40" r="4" fill="#4f46e5" />
      <circle cx="32" cy="32" r="4" fill="#4f46e5" />
    </svg>
  );
}
