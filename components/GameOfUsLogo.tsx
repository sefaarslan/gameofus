interface GameOfUsLogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "full" | "mark-only";
  className?: string;
}

export function GameOfUsLogo({ size = "md", variant = "full", className = "" }: GameOfUsLogoProps) {
  const markSize = { sm: 24, md: 32, lg: 44 }[size];
  const wordmarkSize = { sm: "text-sm", md: "text-headline-md", lg: "text-headline-lg" }[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Mark: two overlapping speech bubbles */}
      <svg
        width={markSize}
        height={markSize}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        {/* Back bubble — secondary voice, offset top-right */}
        <path
          d="M36 6C36 3.79 34.21 2 32 2H18C15.79 2 14 3.79 14 6V16C14 18.21 15.79 20 18 20H26L24 24L30 20H32C34.21 20 36 18.21 36 16V6Z"
          fill="#ae2f34"
          fillOpacity="0.22"
        />
        {/* Front bubble — primary voice, foreground */}
        <path
          d="M22 14C22 11.79 20.21 10 18 10H4C1.79 10 0 11.79 0 14V24C0 26.21 1.79 28 4 28H12L10 32L16 28H18C20.21 28 22 26.21 22 24V14Z"
          fill="#ae2f34"
        />
        {/* Dots inside front bubble — conversation dots */}
        <circle cx="7" cy="19" r="1.5" fill="white" fillOpacity="0.9" />
        <circle cx="11" cy="19" r="1.5" fill="white" fillOpacity="0.9" />
        <circle cx="15" cy="19" r="1.5" fill="white" fillOpacity="0.9" />
      </svg>

      {/* Wordmark */}
      {variant === "full" && (
        <span className={`font-sans leading-none tracking-tight ${wordmarkSize}`}>
          <span className="font-medium text-on-background">game of </span>
          <span className="font-bold text-primary">us</span>
        </span>
      )}
    </div>
  );
}
