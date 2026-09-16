/** @jsxImportSource solid-js */
import { splitProps } from "solid-js";
import type { ComponentProps } from "solid-js";
import { Accordion as AccordionPrimitive } from "@kobalte/core";

import { cn } from "@/components/solid/lib/utils";

export const Accordion = AccordionPrimitive.Root;

export const AccordionItem = (props: ComponentProps<typeof AccordionPrimitive.Item>) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <AccordionPrimitive.Item
      class={cn("border-b", local.class)}
      {...rest}
    />
  );
};

export const AccordionTrigger = (props: ComponentProps<typeof AccordionPrimitive.Trigger>) => {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <AccordionPrimitive.Header class="flex">
      <AccordionPrimitive.Trigger
        class={cn(
          "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-expanded]>svg]:rotate-180 text-left",
          local.class
        )}
        {...rest}
      >
        {local.children}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-4 w-4 shrink-0 transition-transform duration-200"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
};

export const AccordionContent = (props: ComponentProps<typeof AccordionPrimitive.Content>) => {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <AccordionPrimitive.Content
      class={cn(
        "overflow-hidden text-sm transition-all data-[expanded]:animate-accordion-down data-[closed]:animate-accordion-up",
        local.class
      )}
      {...rest}
    >
      <div class="pb-4 pt-0">{local.children}</div>
    </AccordionPrimitive.Content>
  );
};
