import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ContactDialog } from "@/components/ContactDialog"; // Import the new dialog
import type { FAQContent } from "@/data/pagesData";

interface FAQProps {
  content: FAQContent;
}

const FAQ = ({ content }: FAQProps) => {
  const midPoint = Math.ceil(content.faqs.length / 2);
  const leftColumnFaqs = content.faqs.slice(0, midPoint);
  const rightColumnFaqs = content.faqs.slice(midPoint);

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-subtle">
      <div className="mx-auto max-w-4xl">
        {/* ... (Header and Accordion Grid remain same) ... */}
        <div className="text-center mb-10">
          <h2 className="text-[22px] leading-tight sm:text-3xl md:text-4xl font-bruta font-bold tracking-tight text-foreground mb-4">
            FREQUENTLY ASKED QUESTIONS
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start">
           {/* ... (Accordions remain same) ... */}
           {/* Re-paste the accordion code from previous context if needed, but I'll assume you know where it fits */}
           <Accordion type="single" collapsible className="w-full flex flex-col gap-4">
            {leftColumnFaqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="rounded-lg border border-border bg-card px-5 shadow-sm"
              >
                <AccordionTrigger className="text-left font-recoleta font-medium text-card-foreground hover:no-underline py-3 text-base">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm pb-3">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <Accordion type="single" collapsible className="w-full flex flex-col gap-4">
            {rightColumnFaqs.map((faq, index) => (
              <AccordionItem
                key={index + midPoint}
                value={`item-${index + midPoint}`}
                className="rounded-lg border border-border bg-card px-5 shadow-sm"
              >
                <AccordionTrigger className="text-left font-recoleta font-medium text-card-foreground hover:no-underline py-3 text-base">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm pb-3">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
            Still have questions?{" "}
            {/* REPLACE LINK WITH DIALOG */}
            <ContactDialog />
          </p>
        </div>
      </div>
    </section>
  );
};

export default FAQ;