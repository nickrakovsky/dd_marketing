const integrations = [
  {
    name: "Microsoft Entra (SSO)",
    icon: "/images/integrations/microsoft-sso-entra.svg",
    href: "https://datadocks.com/integrations/microsoft-sso-entra",
  },
  {
    name: "SAP Business ByDesign®",
    icon: "/images/integrations/sap-business-bydesign.svg",
    href: "https://datadocks.com/integrations/sap-business-bydesign",
  },
  {
    name: "Oracle® Fusion Cloud",
    icon: "/images/integrations/oracle-fusion-cloud.svg",
    href: "https://datadocks.com/integrations/oracle-fusion-cloud",
  },
  {
    name: "Netsuite ERP",
    icon: "/images/integrations/netsuite-erp.svg",
    href: "https://datadocks.com/integrations/netsuite-erp",
  },
  {
    name: "SAP S/4HANA®",
    icon: "/images/integrations/sap-s-4hana.svg",
    href: "https://datadocks.com/integrations/sap-s-4hana",
  },
  {
    name: "Microsoft Power BI",
    icon: "/images/integrations/microsoft-power-bi.svg",
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
          width={24}
          height={24}
          loading="lazy"
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