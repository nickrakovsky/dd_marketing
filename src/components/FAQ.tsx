import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ContactDialog } from "@/components/ContactDialog"; // Import the new dialog
import type { FAQContent } from "@/data/pagesData";

interface FAQProps {
  content: FAQContent;
  headerAlign?: "center" | "left";
  noHeader?: boolean;
  noBackground?: boolean;
}

const FAQ = ({ content, headerAlign = "center", noHeader = false, noBackground = false }: FAQProps) => {
  const midPoint = Math.ceil(content.faqs.length / 2);
  const leftColumnFaqs = content.faqs.slice(0, midPoint);
  const rightColumnFaqs = content.faqs.slice(midPoint);

  return (
    <section className={`${noBackground ? "" : "py-12 px-4 sm:px-6 lg:px-8 bg-gradient-subtle"}`}>
      <div className={`${noBackground ? "w-full" : "mx-auto max-w-4xl"}`}>
        
        {!noHeader && (
          <div className={`${headerAlign === "left" ? "text-left" : "text-center"} mb-12`}>
            <h2 className="text-4xl md:text-5xl font-black font-bruta uppercase leading-[0.95] tracking-wide text-foreground">
              Frequently <span className="text-primary">Asked Questions</span>
            </h2>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start">
          <Accordion type="single" collapsible className="w-full flex flex-col gap-4">
            {leftColumnFaqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="rounded-lg border border-border bg-card px-5 shadow-sm"
              >
                <AccordionTrigger className="text-left font-recoleta font-semibold text-card-foreground hover:no-underline py-4 text-lg">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base pb-4 font-recoleta font-medium leading-relaxed">
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
                <AccordionTrigger className="text-left font-recoleta font-semibold text-card-foreground hover:no-underline py-4 text-lg">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base pb-4 font-recoleta font-medium leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
            Still have questions?{" "}
            <ContactDialog />
          </p>
        </div>
      </div>
    </section>
  );
};

export default FAQ;