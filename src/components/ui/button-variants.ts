import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:translate-y-[-1px]",
        accent: "bg-accent text-accent-foreground hover:brightness-105",
        secondary: "bg-secondary text-secondary-foreground hover:bg-muted",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-secondary",
        ghost: "hover:bg-secondary text-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:brightness-110",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
