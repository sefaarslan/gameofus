/** Sahne modunun simgesi: oyundaki karakterle aynı dilde çöp adam (daire kafa + çizgi gövde, el sallıyor). */
export function StickFigureIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="5.5" r="3" />
      <path d="M12 8.5V16" />
      <path d="M12 11.5L7.5 8.5" />
      <path d="M12 11.5L16.5 14" />
      <path d="M12 16L8.5 21.5" />
      <path d="M12 16L15.5 21.5" />
    </svg>
  );
}
