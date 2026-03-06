import { cn } from "@/lib/utils"

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'full' | 'icon'
  theme?: 'dark' | 'light'
  className?: string
}

const sizes = {
  sm: { icon: 32, text: 'text-lg' },
  md: { icon: 40, text: 'text-xl' },
  lg: { icon: 48, text: 'text-2xl' },
}

export function Logo({ size = 'md', variant = 'full', theme = 'dark', className }: LogoProps) {
  const { icon, text } = sizes[size]
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900'
  const accentColor = 'text-emerald-500'

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <rect width="48" height="48" rx="12" className="fill-emerald-500" />
        <path
          d="M14 16C14 14.8954 14.8954 14 16 14H20C21.1046 14 22 14.8954 22 16V32C22 33.1046 21.1046 34 20 34H16C14.8954 34 14 33.1046 14 32V16Z"
          fill="white"
          fillOpacity="0.95"
        />
        <path
          d="M26 16C26 14.8954 26.8954 14 28 14H32C33.1046 14 34 14.8954 34 16V24C34 25.1046 33.1046 26 32 26H28C26.8954 26 26 25.1046 26 24V16Z"
          fill="white"
          fillOpacity="0.95"
        />
        <circle cx="30" cy="31" r="3" fill="white" fillOpacity="0.95" />
      </svg>
      {variant === 'full' && (
        <span className={cn("font-bold", text, textColor)}>
          Izi<span className={accentColor}>Resto</span>
        </span>
      )}
    </div>
  )
}
