import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-amber-500 text-slate-900 hover:bg-amber-400 font-semibold shadow-lg shadow-amber-500/25 transition-all",
        outline: "border border-white/20 bg-white/5 text-white hover:bg-white/10 backdrop-blur-sm",
        ghost: "hover:bg-white/10 text-slate-300 hover:text-white",
        danger: "bg-red-500/90 text-white hover:bg-red-400 shadow-red-500/25",
        success: "bg-emerald-500 text-slate-900 hover:bg-emerald-400 shadow-emerald-500/25",
        cta: "bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-600/30 font-semibold",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-14 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
