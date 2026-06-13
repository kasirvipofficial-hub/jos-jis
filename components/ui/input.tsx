import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-stone-200 bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-stone-400 focus-visible:border-amber-900 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-stone-50 disabled:opacity-50 md:text-sm dark:bg-stone-900/10",
        className
      )}
      {...props}
    />
  )
}

export { Input }
