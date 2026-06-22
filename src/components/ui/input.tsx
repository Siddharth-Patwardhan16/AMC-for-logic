import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-[#262626] bg-[#111111] px-4 py-2 text-sm text-white ring-offset-[#0A0A0A] placeholder:text-[#52525B] focus-visible:outline-none focus-visible:border-[#4F8CFF]/30 focus-visible:ring-1 focus-visible:ring-[#4F8CFF]/10 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
