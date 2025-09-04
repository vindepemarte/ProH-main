"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export function BetaBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        // Core container for the animated border
        "relative rounded-md p-[1.5px]",

        // The animated gradient background
        "bg-[conic-gradient(from_90deg_at_50%_50%,#E0F8F7_0%,#008080_50%,#E0F8F7_100%)]",
        "animate-[rotate_4s_linear_infinite]",
        
        // Applying the external className
        className
      )}
    >
      {/* The inner element with the actual content */}
      <div className="rounded-[5px] bg-slate-900 px-2 py-0.5 text-xs text-white">
        Beta
      </div>
    </div>
  )
}