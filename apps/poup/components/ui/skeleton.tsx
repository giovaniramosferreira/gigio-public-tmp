import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-[rgba(138,5,190,0.12)]', className)}
      {...props}
    />
  )
}

export { Skeleton }
