import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2.5 py-1 text-[11px] font-semibold tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#4F8CFF]/15 text-[#4F8CFF]",
        secondary: "border-transparent bg-[#171717] text-[#A1A1AA]",
        destructive: "border-transparent bg-[#EF4444]/15 text-[#EF4444]",
        outline: "text-[#A1A1AA] border-[#262626]",
        success: "border-transparent bg-[#22C55E]/15 text-[#22C55E]",
        warning: "border-transparent bg-[#EAB308]/15 text-[#EAB308]",
        info: "border-transparent bg-[#3B82F6]/15 text-[#3B82F6]",
        subtle: "border-transparent bg-[#262626] text-[#F5F5F5]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
