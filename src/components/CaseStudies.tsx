import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp } from "lucide-react";
import type { CaseStudiesContent } from "@/data/pagesData";

interface CaseStudiesProps {
  content: CaseStudiesContent;
}

const CaseStudies = ({ content }: CaseStudiesProps) => {
  return (
    <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-subtle">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-8 sm:mb-16">
          <h2 className="text-[26px] leading-[1.15] sm:text-[32px] md:text-4xl font-bruta font-bold tracking-tight text-foreground mb-8 sm:mb-16">
            CLEAR RESULTS FROM OPERATIONS JUST LIKE YOURS                        
          </h2>
        </div>

        <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
          {content.caseStudies.map((caseStudy, index) => (
            <Card key={index} className="p-4 md:p-8 bg-card border-border transition-all hover:shadow-custom-lg">
              {/* Mobile Layout */}
              <div className="md:hidden">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-recoleta font-bold text-card-foreground">{caseStudy.company}</h3>
                    <p className="text-xs text-muted-foreground">{caseStudy.industry}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{caseStudy.metricValue}</div>
                    <div className="text-[10px] text-muted-foreground">{caseStudy.metricLabel}</div>
                  </div>
                </div>
                <div className="space-y-2 mb-3">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-card-foreground">Challenge:</span> {caseStudy.challenge}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-card-foreground">Result:</span> {caseStudy.result}
                  </p>
                </div>
                {/* HIDDEN: Button hidden temporarily as requested */}
                <Button variant="link" className="p-0 h-auto text-xs font-semibold group hidden">
                  Read Full Case Study
                  <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:block">
                <div className="mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-recoleta font-bold text-card-foreground mb-1">{caseStudy.company}</h3>
                      <p className="text-sm text-muted-foreground">{caseStudy.industry}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-accent" />
                  </div>
                  <div className="inline-block rounded-lg bg-gradient-to-r from-primary to-primary-glow p-4">
                    <div className="text-3xl font-bold text-primary-foreground">{caseStudy.metricValue}</div>
                    <div className="text-sm text-primary-foreground/90">{caseStudy.metricLabel}</div>
                  </div>
                </div>
                <div className="space-y-4 mb-6">
                  <div>
                    <h4 className="font-recoleta font-semibold text-card-foreground mb-2">Challenge</h4>
                    <p className="text-muted-foreground">{caseStudy.challenge}</p>
                  </div>
                  <div>
                    <h4 className="font-recoleta font-semibold text-card-foreground mb-2">Result</h4>
                    <p className="text-muted-foreground">{caseStudy.result}</p>
                  </div>
                </div>
                {/* HIDDEN: Button hidden temporarily as requested */}
                <Button variant="link" className="p-0 h-auto font-semibold group hidden">
                  Read Full Case Study
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CaseStudies;