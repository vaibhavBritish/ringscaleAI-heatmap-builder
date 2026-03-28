import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

import { Loader2 } from "lucide-react"

const Button = React.forwardRef(({ className, variant, size, asChild = false, isLoading, cooldown, onClick, disabled, children, ...props }, ref) => {
  const [internalCooldown, setInternalCooldown] = React.useState(false)
  const Comp = asChild ? Slot : "button"
  
  const handleClick = async (e) => {
    if (isLoading || internalCooldown) return
    
    if (onClick) {
      await onClick(e)
    }

    if (cooldown) {
      setInternalCooldown(true)
      setTimeout(() => setInternalCooldown(false), typeof cooldown === 'number' ? cooldown : 1000)
    }
  }

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      disabled={disabled || isLoading || internalCooldown}
      onClick={handleClick}
      {...props}
    >
      {asChild ? children : (
        <>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {children}
        </>
      )}
    </Comp>
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
