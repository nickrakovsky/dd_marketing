export const scenarios = [
  {
    id: 'network',
    label: 'Coordinating the network',
    pairing: 'Logistics expertise and partner relationships',
    context: 'The CoE specializes in logistics and works directly with suppliers or customers.',
    tension: 'A pull toward central ownership',
    explanation: 'It is likely to become the company’s central supply chain owner, taking on more than an advisory role.',
    link: 'ownership',
  },
  {
    id: 'advice',
    label: 'Advising across company boundaries',
    pairing: 'Partner relationships and local control',
    context: 'The CoE works with external partners, while business units retain control of their own supply chains.',
    tension: 'Less scope for complex logistics planning',
    explanation: 'The CoE has limited room to plan complex logistics across the network when decisions remain with individual units.',
    link: 'planning',
  },
  {
    id: 'analytics',
    label: 'Analyzing from within',
    pairing: 'Logistics analysis and an internal advisory role',
    context: 'The CoE acts as an internal analytics consultancy, finding insights for the business.',
    tension: 'A harder path to shared data',
    explanation: 'Those insights can be valuable, but the CoE may struggle to harmonize data with suppliers and customers.',
    link: 'data',
  },
] as const;
