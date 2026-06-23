import { cn } from '@/lib/utils'
import type { HTMLAttributes, ReactNode } from 'react'

type FadeInProps = HTMLAttributes<HTMLDivElement> & {
  /** Delay in seconds before the animation starts */
  delay?: number
  /** 0-based index for built-in stagger classes (0–5) */
  staggerIndex?: number
}

export function FadeIn({
  children,
  className,
  delay,
  staggerIndex,
  style,
  ...props
}: FadeInProps & { children: ReactNode }) {
  const staggerClass =
    staggerIndex != null ? `stagger-${Math.min(staggerIndex + 1, 6)}` : undefined

  return (
    <div
      className={cn('animate-in', staggerClass, className)}
      style={{
        ...style,
        ...(delay != null ? { animationDelay: `${delay}s`, opacity: 0 } : undefined),
      }}
      {...props}
    >
      {children}
    </div>
  )
}
