// MDX cannot discover headings rendered inside the shared article component.
const sections = [
  ['warehouse-audit-working-pack', 'Excel and PDF audit pack'],
  ['what-is-a-warehouse-audit', 'What is a warehouse audit?'],
  ['practical-checklist', 'The Practical Warehouse Audit Checklist'],
  ['plan-the-audit', 'Plan the audit around the decision'],
  ['execute-the-audit', 'Check what happens on the warehouse floor'],
  ['financial-controls', 'Stock discrepancies and financial controls'],
  ['compliance-and-customer-audits', 'Compliance and customer audits'],
  ['findings-and-actions', 'Turn findings into decisions'],
  ['get-warehouse-audit-pack', 'Get the checklist in Excel and PDF'],
  ['audit-frequency', 'How often should you audit?'],
  ['technology-and-people', 'Technology and the people doing the work'],
  ['references', 'References'],
] as const;

export const warehouseAuditHeadings = sections.map(([slug, text]) => ({
  depth: 2,
  slug,
  text,
}));
