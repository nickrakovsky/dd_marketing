/** @jsxImportSource solid-js */
import { For } from "solid-js";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./ui/accordion";

interface FAQ {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  faqs: FAQ[];
}

export function FAQAccordion(props: FAQAccordionProps) {
  if (!props.faqs || props.faqs.length === 0) {
    return null;
  }

  return (
    <div class="w-full max-w-3xl mx-auto my-16 px-6 lg:px-8">
      <h2 class="text-3xl font-bold font-recoleta mb-8 text-center text-gray-900">Frequently Asked Questions</h2>
      <Accordion multiple={false} collapsible class="w-full bg-white rounded-none shadow-custom-lg p-8 border border-border">
        <For each={props.faqs}>
          {(faq, index) => (
            <AccordionItem value={`item-${index()}`}>
              <AccordionTrigger class="text-lg font-medium text-left">{faq.question}</AccordionTrigger>
              <AccordionContent class="text-gray-600 text-base mt-2">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          )}
        </For>
      </Accordion>
    </div>
  );
}
