import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-xl px-3 py-2 text-xs outline-none transition-colors',
        'placeholder:text-[#6b4d80]',
        'border border-[rgba(138,5,190,0.2)] bg-[#0d001a] text-[#f0e6ff]',
        'focus:border-[#8A05BE]',
        '[font-family:DM_Sans,sans-serif]',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export { Input }
