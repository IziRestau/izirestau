"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  accentColor?: string
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, accentColor, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track
      className={cn("relative h-1.5 w-full grow overflow-hidden rounded-full", !accentColor && "bg-primary/20")}
      style={accentColor ? { backgroundColor: `${accentColor}30` } : undefined}
    >
      <SliderPrimitive.Range
        className={cn("absolute h-full", !accentColor && "bg-primary")}
        style={accentColor ? { backgroundColor: accentColor } : undefined}
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className={cn(
        "block h-4 w-4 rounded-full border bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        !accentColor && "border-primary/50"
      )}
      style={accentColor ? { borderColor: `${accentColor}80` } : undefined}
    />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
