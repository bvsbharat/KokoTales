import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-none text-sm font-bold uppercase tracking-wide ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "comic-button",
        secondary: "comic-button-secondary",
        destructive: "bg-comic-red text-white border-4 border-black shadow-comic hover:shadow-comic-lg hover:translate-x-1 hover:translate-y-1 active:shadow-none active:translate-x-2 active:translate-y-2",
        outline: "bg-transparent text-comic-black border-4 border-black shadow-comic hover:bg-comic-yellow hover:shadow-comic-lg hover:translate-x-1 hover:translate-y-1",
        ghost: "bg-transparent text-comic-black hover:bg-comic-yellow hover:shadow-comic border-2 border-transparent hover:border-black",
        link: "text-comic-blue underline-offset-4 hover:underline font-bold",
      },
      size: {
        default: "h-10 px-6 py-3",
        sm: "h-9 rounded-none px-4",
        lg: "h-12 rounded-none px-8 text-lg",
        xl: "h-16 rounded-none px-10 text-xl",
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
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }