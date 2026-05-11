export interface Author {
  name: string;
  slug: string;
  role: string;
  shortBio: string;
  linkedIn?: string;
}

export const authors: Record<string, Author> = {
  "Joe Fitzpatrick": {
    name: "Joe Fitzpatrick",
    slug: "joe-fitzpatrick",
    role: "Lead Researcher",
    shortBio: "Joe heads up research and content for DataDocks. He focuses on operational and go-to-market insights for supply chain companies.",
  },
  "Noel Moffatt": {
    name: "Noel Moffatt",
    slug: "noel-moffatt",
    role: "Business Strategist",
    shortBio: "Noel is a data-driven business strategist focused on logistics operations. He researches dock scheduling, yard management, and supply chain efficiency, translating operational data into practical insights for warehouse and DC leaders.",
  },
  "Nick Rakovsky": {
    name: "Nick Rakovsky",
    slug: "nick-rakovsky",
    role: "CEO, DataDocks",
    shortBio: "Nick is the CEO of DataDocks, the dock scheduling and yard management platform he co-founded in 2013. He leads product strategy and works directly with enterprise warehouse and distribution operations across North America.",
    linkedIn: "https://www.linkedin.com/in/nickrakovsky",
  },
  "Tim Branch": {
    name: "Tim Branch",
    slug: "tim-branch",
    role: "Researcher & Writer",
    shortBio: "Tim is a researcher, writer, and co-founder of a company serving the HVAC industry. He brings an analytical approach to operations topics, with a focus on translating industry data into practical guidance.",
  },
  "Jessica Edgson": {
    name: "Jessica Edgson",
    slug: "jessica-edgson",
    role: "Researcher & Writer",
    shortBio: "Jessica is a researcher and writer specializing in logistics technology and warehouse operations. Her work focuses on helping operations teams understand how the right tools change day-to-day performance.",
  },
  "Hunter Branch": {
    name: "Hunter Branch",
    slug: "hunter-branch",
    role: "Contributing Editor",
    shortBio: "Hunter is a contributing editor at DataDocks and the co-founder and CEO of a company that supports the HVAC industry. He brings an operator's perspective to research and editorial work across supply chain and operations topics.",
  },
  "Chris La Porte": {
    name: "Chris La Porte",
    slug: "chris-la-porte",
    role: "Writer & Editor",
    shortBio: "Chris is a writer and editor with a background in retail merchandising. He covers supply chain operations, dock scheduling, and logistics technology with a focus on clarity and practical application.",
  },
  "DataDocks": {
    name: "DataDocks Team",
    slug: "datadocks-team",
    role: "DataDocks",
    shortBio: "DataDocks is a dock scheduling and yard management platform founded in 2013. This content is produced by the DataDocks team based on operational research, customer experience, and platform data.",
  },
  "Tim Branch & Joe Fitzpatrick": {
    name: "Tim Branch & Joe Fitzpatrick",
    slug: "tim-branch",
    role: "Researchers",
    shortBio: "A collaborative research piece by Tim Branch and Joe Fitzpatrick focusing on operational efficiency and supply chain data.",
  },
};

export function getAuthor(name: string): Author {
  return authors[name] || authors["DataDocks"];
}
