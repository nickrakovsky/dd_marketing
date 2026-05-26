/** @jsxImportSource solid-js */
import { createSignal } from "solid-js";
import { Button } from "@/components/solid/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/solid/ui/card";

/**
 * Smoke test component to validate the SolidJS + shadcn-solid integration.
 * Verifies: SolidJS reactivity, Tailwind rendering, CSS variable theming,
 * and correct hydration within an Astro island.
 *
 * Remove this component after validation is complete.
 */
export default function HelloSolid() {
  const [count, setCount] = createSignal(0);

  return (
    <Card class="w-full max-w-md mx-auto border-2 border-primary/20">
      <CardHeader class="bg-primary/5 border-b border-primary/10">
        <CardTitle class="font-bruta uppercase tracking-tight text-primary">
          SolidJS Integration Test
        </CardTitle>
        <CardDescription class="font-recoleta">
          If you can see this card, interact with the button, and the count updates — the integration works.
        </CardDescription>
      </CardHeader>
      <CardContent class="pt-6">
        <div class="text-center space-y-4">
          <p class="text-6xl font-recoleta font-bold text-primary tracking-tight">
            {count()}
          </p>
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Click count
          </p>
        </div>
      </CardContent>
      <CardFooter class="flex gap-3 justify-center">
        <Button variant="outline" size="sm" onclick={() => setCount((c) => Math.max(0, c - 1))}>
          −
        </Button>
        <Button variant="default" onclick={() => setCount((c) => c + 1)}>
          Increment
        </Button>
        <Button variant="ghost" size="sm" onclick={() => setCount(0)}>
          Reset
        </Button>
      </CardFooter>
    </Card>
  );
}
