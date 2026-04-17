/**
 * VerifiedBadge - Facebook/X-style blue verified tick.
 * Pure SVG so it scales crisply at any size and respects currentColor fallback.
 */
interface VerifiedBadgeProps {
  size?: number;
  className?: string;
  title?: string;
}

const VerifiedBadge = ({ size = 14, className = '', title = 'Verified' }: VerifiedBadgeProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block flex-shrink-0 align-middle ${className}`}
    role="img"
    aria-label={title}
    style={{ filter: 'drop-shadow(0 1px 2px hsla(210, 90%, 50%, 0.25))' }}
  >
    <title>{title}</title>
    {/* Scalloped/star burst shape (Facebook style) */}
    <path
      d="M12 1.5l2.39 1.79 2.97-.36 1.05 2.8 2.8 1.05-.36 2.97L22.5 12l-1.79 2.39.36 2.97-2.8 1.05-1.05 2.8-2.97-.36L12 22.5l-2.39-1.79-2.97.36-1.05-2.8-2.8-1.05.36-2.97L1.5 12l1.79-2.39-.36-2.97 2.8-1.05 1.05-2.8 2.97.36L12 1.5z"
      fill="hsl(210, 90%, 52%)"
    />
    {/* Inner check mark */}
    <path
      d="M8.5 12.3l2.4 2.4 4.6-5"
      stroke="white"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

export default VerifiedBadge;
