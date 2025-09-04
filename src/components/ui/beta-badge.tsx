"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export function BetaBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        // The main container. It needs to be relative and hide overflow.
        "relative inline-block rounded-md p-[1.5px] overflow-hidden",
        className
      )}
    >
      {/* This is the pseudo-element that creates the spinning border.
        It's positioned behind the content.
        We apply the gradient and animation here.
      */}
      <div
        className={cn(
          "before:content-[''] before:absolute before:inset-0 before:z-0",
          "before:bg-[conic-gradient(from_90deg_at_50%_50%,#E0F8F7_0%,#008080_50%,#E0F8F7_100%)]",
          "before:animate-[rotate_4s_linear_infinite]"
        )}
      />
      
      {/* The inner element with the actual content.
        It needs to be relative with a higher z-index to appear on top.
      */}
      <div className="relative z-10 rounded-[5px] bg-slate-900 px-2 py-0.5 text-xs text-white">
        Beta
      </div>
    </div>
  )
}