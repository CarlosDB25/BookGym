export function Logo({ className = '', size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logoBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#4338ca" />
        </linearGradient>
        <linearGradient id="logoBar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e0e7ff" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="200" height="200" rx="50" fill="url(#logoBg)" />

      <g opacity="0.12" fill="#ffffff">
        <circle cx="40" cy="40" r="3" />
        <circle cx="80" cy="40" r="3" />
        <circle cx="120" cy="40" r="3" />
        <circle cx="160" cy="40" r="3" />
        <circle cx="40" cy="68" r="3" />
        <circle cx="80" cy="68" r="3" />
        <circle cx="120" cy="68" r="3" />
        <circle cx="160" cy="68" r="3" />
      </g>

      <g>
        <rect x="40" y="78" width="20" height="44" rx="6" fill="url(#logoBar)" />
        <rect x="140" y="78" width="20" height="44" rx="6" fill="url(#logoBar)" />
        <rect x="60" y="86" width="10" height="28" rx="3" fill="url(#logoBar)" opacity="0.85" />
        <rect x="130" y="86" width="10" height="28" rx="3" fill="url(#logoBar)" opacity="0.85" />
        <rect x="60" y="93" width="80" height="14" rx="3" fill="url(#logoBar)" />
      </g>

      <g>
        <circle cx="150" cy="152" r="22" fill="#10b981" />
        <circle cx="150" cy="152" r="22" fill="none" stroke="#ffffff" strokeWidth="4" />
        <path
          d="M140 152l7 7 14-14"
          stroke="#ffffff"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}

export function LogoWordmark({ className = '', tone = 'light' }) {
  const bookColor = tone === 'light' ? 'text-white' : 'text-slate-900 dark:text-slate-100'
  const gymColor = tone === 'light' ? 'text-white' : 'text-primary'
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Logo size={36} />
      <span className="text-xl tracking-tight">
        <span className={`font-light ${bookColor}`}>Book</span>
        <span className={`font-extrabold ${gymColor}`}>Gym</span>
      </span>
    </div>
  )
}
