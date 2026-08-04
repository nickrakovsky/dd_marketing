/** @jsxImportSource solid-js */
import { splitProps } from "solid-js";
import type { ComponentProps } from "solid-js";
import { Tabs as TabsPrimitive } from "@kobalte/core";

import { cn } from "@/components/solid/lib/utils";

export const Tabs = (props: ComponentProps<typeof TabsPrimitive.Root>) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <TabsPrimitive.Root
      class={cn("w-full", local.class)}
      {...rest}
    />
  );
};

export const TabsList = (props: ComponentProps<typeof TabsPrimitive.List>) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <TabsPrimitive.List
      class={cn(
        "inline-flex items-center gap-1 rounded-lg bg-[#ece6de] p-1 flex-wrap",
        local.class
      )}
      {...rest}
    />
  );
};

export const TabsTrigger = (props: ComponentProps<typeof TabsPrimitive.Trigger>) => {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <TabsPrimitive.Trigger
      class={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all",
        "text-[#5f483a] hover:text-[#fd4f00]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fd4f00] focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[selected]:bg-white data-[selected]:text-[#fd4f00] data-[selected]:shadow-sm",
        local.class
      )}
      {...rest}
    >
      {local.children}
    </TabsPrimitive.Trigger>
  );
};

export const TabsContent = (props: ComponentProps<typeof TabsPrimitive.Content>) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <TabsPrimitive.Content
      class={cn(
        "mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fd4f00] focus-visible:ring-offset-2",
        local.class
      )}
      {...rest}
    />
  );
};
