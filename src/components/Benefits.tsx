import { Card } from "@/components/ui/card";
import { getIcon } from "@/utils/iconRegistry";
import type { BenefitsContent } from "@/data/pagesData";

interface BenefitsProps {
  content: BenefitsContent;
}

const Benefits = ({ content }: BenefitsProps) => {

 return (
    <section className="py-12 px-2 sm:px-6 lg:px-8 bg-background">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-2 sm:gap-6 grid-cols-2 md:grid-cols-3">
          {content.benefits.map((benefit, index) => {
            const Icon = getIcon(benefit.icon);
            return (
              <Card 
                key={index}
                className="group p-4 sm:p-8 transition-all duration-300 hover:shadow-custom-lg hover:scale-105 bg-card border-border"
              >
                <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-4 md:flex-col md:gap-0">
                  <div className="inline-flex items-center justify-center rounded-lg bg-primary/10 p-1.5 sm:p-2 md:p-3 transition-colors group-hover:bg-primary/20 flex-shrink-0 md:mb-4">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
                  </div>
                  <h3 className="text-[15px] sm:text-xl font-recoleta font-semibold text-card-foreground md:mb-3">
                    {benefit.title}
                  </h3>
                </div>
                <p className="text-[13px] sm:text-base text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
