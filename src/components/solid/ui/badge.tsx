/** @jsxImportSource solid-js */
import { splitProps } from "solid-js";
import type { Component, JSX } from "solid-js";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/components/solid/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#fd4f00] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#fd4f00] text-white",
        success: "border-transparent bg-[#4a8136] text-white",
        warning: "border-transparent bg-[#ffdba5] text-[#5f483a]",
        destructive: "border-transparent bg-[#cb4949] text-white",
        outline: "border-[#9c806d] text-[#5f483a]",
        muted: "border-transparent bg-[#ece6de] text-[#5f483a]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

type BadgeProps = JSX.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants> & {
    class?: string;
  };

const Badge: Component<BadgeProps> = (props) => {
  const [local, others] = splitProps(props, ["variant", "class", "children"]);
  return (
    <span
      class={cn(badgeVariants({ variant: local.variant }), local.class)}
      {...others}
    >
      {local.children}
    </span>
  );
};

export { Badge, badgeVariants };
