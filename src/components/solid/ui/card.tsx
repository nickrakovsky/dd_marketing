/** @jsxImportSource solid-js */
import { splitProps } from "solid-js";
import type { Component, JSX } from "solid-js";
import { cn } from "@/components/solid/lib/utils";

type CardProps = JSX.HTMLAttributes<HTMLDivElement> & { class?: string };

const Card: Component<CardProps> = (props) => {
  const [local, others] = splitProps(props, ["class", "children"]);
  return (
    <div class={cn("rounded-lg border bg-card text-card-foreground shadow-sm", local.class)} {...others}>
      {local.children}
    </div>
  );
};

const CardHeader: Component<CardProps> = (props) => {
  const [local, others] = splitProps(props, ["class", "children"]);
  return (
    <div class={cn("flex flex-col space-y-1.5 p-6", local.class)} {...others}>
      {local.children}
    </div>
  );
};

const CardTitle: Component<JSX.HTMLAttributes<HTMLHeadingElement> & { class?: string }> = (props) => {
  const [local, others] = splitProps(props, ["class", "children"]);
  return (
    <h3 class={cn("text-2xl font-semibold leading-none tracking-tight", local.class)} {...others}>
      {local.children}
    </h3>
  );
};

const CardDescription: Component<JSX.HTMLAttributes<HTMLParagraphElement> & { class?: string }> = (props) => {
  const [local, others] = splitProps(props, ["class", "children"]);
  return (
    <p class={cn("text-sm text-muted-foreground", local.class)} {...others}>
      {local.children}
    </p>
  );
};

const CardContent: Component<CardProps> = (props) => {
  const [local, others] = splitProps(props, ["class", "children"]);
  return (
    <div class={cn("p-6 pt-0", local.class)} {...others}>
      {local.children}
    </div>
  );
};

const CardFooter: Component<CardProps> = (props) => {
  const [local, others] = splitProps(props, ["class", "children"]);
  return (
    <div class={cn("flex items-center p-6 pt-0", local.class)} {...others}>
      {local.children}
    </div>
  );
};

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
