"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export function BetaBadge({ className }: { className?: string }) {
  return (
    <div className={cn(
      "relative cursor-pointer text-sm rounded-xl border-none p-0.5",
      "bg-[radial-gradient(circle_80px_at_80%_-10%,#E0F8F7,#008080)]",
      className
    )}>
      <div className="absolute w-[65%] h-[60%] rounded-[120px] top-0 right-0 shadow-[0_0_20px_rgba(0,128,128,0.22)] -z-10" />
      <div className="absolute w-[70px] h-full rounded-xl bottom-0 left-0 bg-[radial-gradient(circle_60px_at_0%_100%,#FF7F50,#00808080,transparent)] shadow-[-10px_10px_30px_rgba(255,127,80,0.18)]" />
      <div className="px-3 py-1.5 rounded-[14px] text-white z-10 relative bg-[radial-gradient(circle_80px_at_80%_-50%,#008080,#E0F8F7)]">
        <div className="absolute inset-0 rounded-[14px] bg-[radial-gradient(circle_60px_at_0%_100%,rgba(255,127,80,0.1),rgba(0,128,128,0.07),transparent)]" />
        Beta
      </div>
    </div>
  )
}