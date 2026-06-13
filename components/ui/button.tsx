import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-lg text-sm font-medium whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-amber-900 text-white hover:bg-amber-950",
        outline:
          "border border-stone-200 bg-white hover:bg-stone-50 text-stone-900",
        secondary:
          "bg-stone-100 text-stone-900 hover:bg-stone-200",
        ghost:
          "hover:bg-stone-50 text-stone-700",
        destructive:
          "bg-red-500 text-white hover:bg-red-600",
        link: "text-amber-950 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 gap-1.5 px-3",
        xs: "h-6 gap-1 px-1.5 text-xs",
        sm: "h-7 gap-1 px-2 text-[0.8rem]",
        lg: "h-10 gap-2 px-4.5 text-base",
        icon: "size-8 flex items-center justify-center p-0",
        "icon-xs": "size-6 flex items-center justify-center p-0",
        "icon-sm": "size-7 flex items-center justify-center p-0",
        "icon-lg": "size-9 flex items-center justify-center p-0",
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
