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
      <rect x="50" y="40" width="20" height="120" rx="4" fill="#4f46e5" />
      <circle cx="110" cy="75" r="35" stroke="#4f46e5" strokeWidth="12" fill="none" />
      <path
        d="M70 110C70 110 100 110 120 110C145 110 160 125 160 140C160 155 145 160 120 160H70V110Z"
        fill="#10b981"
      />
      <path
        d="M85 150L105 135L125 145L145 125"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M54 100L58 104L66 96"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function LogoWordmark({ className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Logo size={36} />
      <span className="text-xl tracking-tight">
        <span className="font-light text-white">Book</span>
        <span className="font-extrabold text-white">Gym</span>
      </span>
    </div>
  )
}
