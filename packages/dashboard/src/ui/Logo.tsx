type LogoProps = {
  size?: "small" | "large";
  showWordmark?: boolean;
};

export function Logo({ size = "small", showWordmark = false }: LogoProps) {
  return (
    <div className={`logo-lockup ${size}`}>
      <svg className="logo-mark" viewBox="0 0 48 48" role="img" aria-label="Ding logo">
        <rect x="4" y="4" width="40" height="40" rx="10" fill="oklch(0.207 0.034 264)" />
        <path
          d="M17 28.5V21a7 7 0 0 1 14 0v7.5l3 4.5H14l3-4.5Z"
          fill="none"
          stroke="oklch(1 0 0)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M21 36a3.5 3.5 0 0 0 6 0" fill="none" stroke="oklch(1 0 0)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="34" cy="14" r="5" fill="oklch(0.546 0.232 261)" stroke="oklch(1 0 0)" strokeWidth="2" />
      </svg>
      {showWordmark ? (
        <div>
          <div className="brand">Ding</div>
          <div className="subtle">Changelog admin</div>
        </div>
      ) : null}
    </div>
  );
}
