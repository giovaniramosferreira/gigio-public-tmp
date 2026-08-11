import * as React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'category'
  color?: string
}

function Badge({ className, variant = 'default', color, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs [font-family:DM_Sans,sans-serif]',
        variant === 'default' && 'bg-[rgba(138,5,190,0.15)] text-[#d49dff]',
        className
      )}
      style={variant === 'category' && color ? { background: `${color}22`, color } : undefined}
      {...props}
    >
      {children}
    </span>
  )
}

export { Badge }
