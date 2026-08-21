const STRIPES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const STARS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export function UnitedStatesFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 21 15" className={className} aria-hidden="true" focusable="false">
      <rect width="21" height="15" fill="#f0f2f5" />
      {STRIPES.filter((stripe) => stripe % 2 === 0).map((stripe) => (
        <rect key={stripe} y={(stripe * 15) / 13} width="21" height={15 / 13} fill="#b8404a" />
      ))}
      <rect width="9" height={(15 / 13) * 7} fill="#3b4a80" />
      {STARS.map((star) => (
        <circle
          key={star}
          cx={1.2 + (star % 4) * 2.2}
          cy={1.2 + Math.floor(star / 4) * 2.2}
          r="0.42"
          fill="#f0f2f5"
        />
      ))}
    </svg>
  );
}

export function BrazilFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 21 15" className={className} aria-hidden="true" focusable="false">
      <rect width="21" height="15" fill="#2f7d52" />
      <path d="M10.5 1.6 19.4 7.5 10.5 13.4 1.6 7.5Z" fill="#e8c547" />
      <circle cx="10.5" cy="7.5" r="3.3" fill="#3b4a80" />
      <path d="M7.4 6.4a7.6 7.6 0 0 1 6.3 1.7" stroke="#f0f2f5" strokeWidth="0.8" fill="none" />
    </svg>
  );
}
