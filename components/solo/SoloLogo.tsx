/** Red Flag Mayın Tarlası logosu: kırmızı rozet üzerinde bayrak + mayın. Boyut `className` ile verilir. */
export function SoloLogo({ className = "w-16 h-16" }: { className?: string }) {
  const spikes = [0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return { x1: 19 + Math.cos(rad) * 6.5, y1: 45 + Math.sin(rad) * 6.5, x2: 19 + Math.cos(rad) * 11, y2: 45 + Math.sin(rad) * 11 };
  });
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Red Flag Mayın Tarlası">
      <defs>
        <linearGradient id="solo-logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e0524a" />
          <stop offset="1" stopColor="#ae2f34" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#solo-logo-bg)" />
      {/* bayrak */}
      <path d="M39 11v36" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      <path d="M41.5 12.5L56 19.5L41.5 26.5Z" fill="#fff" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="39" cy="49" rx="11" ry="3.5" fill="#fff" fillOpacity="0.3" />
      {/* mayın */}
      <g stroke="#2b1514" strokeWidth="2.6" strokeLinecap="round">
        {spikes.map((s, i) => (
          <line key={i} {...s} />
        ))}
      </g>
      <circle cx="19" cy="45" r="7.4" fill="#2b1514" />
      <circle cx="16.6" cy="42.6" r="1.9" fill="#fff" fillOpacity="0.85" />
      {/* fitil + kıvılcım */}
      <path d="M23 39.5Q26 35.5 29 36.5" stroke="#2b1514" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="30" cy="36.3" r="2.4" fill="#ffd45e" />
    </svg>
  );
}

/** Kapalı kartların üzerindeki bayrak işareti (tek renk, `currentColor`). */
export function FlagMark({ size = 40, opacity = 0.3 }: { size?: number; opacity?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ color: "#ae2f34", opacity }} aria-hidden="true" fill="none">
      <path d="M7 3.5v17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M8.6 4.6L19.5 9.4L8.6 14.2Z" fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
