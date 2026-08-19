import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-none border-2 border-black font-heading font-black uppercase tracking-wider text-xs whitespace-nowrap transition-all outline-none select-none active:translate-x-0.5 active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 shadow-[2px_2px_0px_#000000] hover:shadow-[4px_4px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline:
          "border-black bg-white text-black hover:bg-primary/10",
        secondary:
          "bg-white text-black hover:bg-primary hover:text-primary-foreground",
        ghost:
          "shadow-none hover:shadow-[2px_2px_0px_#000000] hover:border-black border-transparent text-black hover:bg-white",
        destructive:
          "bg-[#FF0055] text-white border-black hover:bg-primary hover:text-primary-foreground",
        link: "border-none shadow-none text-black underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-9 gap-2 px-4 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xs: "h-6 gap-1 px-2 text-[10px] [&_svg:not([class*='size-'])]:size-3 shadow-[1px_1px_0px_#000000] hover:shadow-[2px_2px_0px_#000000]",
        sm: "h-7 gap-1.5 px-3 text-[11px] [&_svg:not([class*='size-'])]:size-3.5 shadow-[2px_2px_0px_#000000] hover:shadow-[3px_3px_0px_#000000]",
        lg: "h-11 gap-2.5 px-6 text-sm shadow-[3px_3px_0px_#000000] hover:shadow-[5px_5px_0px_#000000]",
        icon: "size-9",
        "icon-xs": "size-6 shadow-[1px_1px_0px_#000000] hover:shadow-[2px_2px_0px_#000000] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 shadow-[2px_2px_0px_#000000] hover:shadow-[3px_3px_0px_#000000]",
        "icon-lg": "size-11 shadow-[3px_3px_0px_#000000] hover:shadow-[5px_5px_0px_#000000]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

