'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface IconInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon
  suffix?: string
  focusColor?: string
}

const IconInput = React.forwardRef<HTMLInputElement, IconInputProps>(
  ({ className, icon: Icon, suffix, type, focusColor, ...props }, ref) => {
    return (
      <div className="relative">
        {Icon && (
          <Icon 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
            size={18} 
          />
        )}
        <input
          type={type}
          className={cn(
            "w-full py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors",
            !focusColor && "focus:ring-emerald-500/20 focus:border-emerald-300",
            Icon ? "pl-10 pr-4" : "px-4",
            suffix && "pr-12",
            props.disabled && "bg-gray-50 text-gray-500 cursor-not-allowed",
            className
          )}
          style={focusColor ? { '--tw-ring-color': `${focusColor}80`, '--focus-border': focusColor } as React.CSSProperties : undefined}
          ref={ref}
          {...props}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            {suffix}
          </span>
        )}
      </div>
    )
  }
)
IconInput.displayName = 'IconInput'

export { IconInput }
