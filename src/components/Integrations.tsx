const integrations = [
  {
    name: "Microsoft Entra (SSO)",
    icon: "https://cdn.prod.website-files.com/63d769389c1d37bdff4f1c82/669251f71d7dc3f818bc5989_Microsoft%20SSO%20(Entra).svg",
    href: "https://datadocks.com/integrations/microsoft-sso-entra",
  },
  {
    name: "SAP Business ByDesign®",
    icon: "https://cdn.prod.website-files.com/63d769389c1d37bdff4f1c82/669251d78f4d48a0d249d5be_SAP%20Business%20ByDesign.svg",
    href: "https://datadocks.com/integrations/sap-business-bydesign",
  },
  {
    name: "Oracle® Fusion Cloud",
    icon: "https://cdn.prod.website-files.com/63d769389c1d37bdff4f1c82/669251ac3ee15660333a7f75_Oracle%20Fusion%20Cloud.svg",
    href: "https://datadocks.com/integrations/oracle-fusion-cloud",
  },
  {
    name: "Netsuite ERP",
    icon: "https://cdn.prod.website-files.com/63d769389c1d37bdff4f1c82/669250dc386ea53b2340b3f9_Netsuite%20ERP.svg",
    href: "https://datadocks.com/integrations/netsuite-erp",
  },
  {
    name: "SAP S/4HANA®",
    icon: "https://cdn.prod.website-files.com/63d769389c1d37bdff4f1c82/669250b8809f558b0ab88125_SAP%20S%3A4HANA.svg",
    href: "https://datadocks.com/integrations/sap-s-4hana",
  },
  {
    name: "Microsoft Power BI",
    icon: "https://cdn.prod.website-files.com/63d769389c1d37bdff4f1c82/6692506e5cf5dc1cce5caa25_Microsoft%20Power%20BI.svg",
    href: "https://datadocks.com/integrations/microsoft-power-bi",
  },
];

interface IntegrationsProps {
  content?: any;
}

const Integrations = ({ content }: IntegrationsProps) => {
  const ANIMATION_DURATION = "40s";

  const IntegrationCard = ({ integration }: { integration: (typeof integrations)[0] }) => (
    <a
      href={integration.href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-card border border-border/80 rounded-md hover:border-primary transition-colors group flex-shrink-0 cursor-pointer no-underline select-none"
    >
      <div className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0">
        <img
          src={integration.icon}
          alt={`${integration.name} icon`}
          className="h-full w-full object-contain opacity-90 group-hover:opacity-100 transition-opacity"
        />
      </div>
      <h3 className="font-recoleta font-semibold text-muted-foreground group-hover:text-foreground text-xs sm:text-sm whitespace-nowrap transition-colors">
        {integration.name}
      </h3>
    </a>
  );

  return (
    <section className="py-6 px-4 sm:px-6 lg:px-8 bg-muted/30 border-y border-border/40 overflow-hidden">
      <div className="mx-auto max-w-[1400px]">
        <style>{`
          @keyframes scroll-integrations {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee-integrations {
            animation: scroll-integrations ${ANIMATION_DURATION} linear infinite;
          }
          .mask-fade-sides {
            mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
            -webkit-mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
          }
        `}</style>

        <p className="text-center text-[10px] sm:text-xs font-bold text-muted-foreground/70 mb-4 tracking-widest uppercase font-sans">
          Yes! We integrate with:
        </p>

        <div className="relative w-full overflow-hidden mask-fade-sides">
          <div className="flex w-max animate-marquee-integrations hover:[animation-play-state:paused]">
            <div className="flex gap-3 px-1.5">
              {integrations.map((integration, index) => (
                <IntegrationCard key={`a-${index}`} integration={integration} />
              ))}
            </div>
            <div className="flex gap-3 px-1.5">
              {integrations.map((integration, index) => (
                <IntegrationCard key={`b-${index}`} integration={integration} />
              ))}
            </div>
            <div className="flex gap-3 px-1.5">
              {integrations.map((integration, index) => (
                <IntegrationCard key={`c-${index}`} integration={integration} />
              ))}
            </div>
          </div>
        </div>

        {/* UPDATED: Link styling to match surrounding text color (text-muted-foreground) */}
        <p className="text-center text-xs sm:text-sm text-muted-foreground mt-6 max-w-2xl mx-auto">
          Don't see your platform listed?{" "}
          <a 
            href="https://datadocks.com/integrations"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-muted-foreground hover:text-primary transition-colors underline"
          >
            We likely support it already.
          </a>{" "}
          If not, we'll build the integration you need to ensure seamless connectivity with your existing stack.
        </p>
      </div>
    </section>
  );
};

export default Integrations;