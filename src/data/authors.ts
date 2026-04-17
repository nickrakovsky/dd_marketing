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
    role: "Marketing Lead",
    shortBio: "Joe leads marketing at DataDocks, driving awareness and growth for the dock scheduling platform across the logistics industry.",
  },
  "Noel Moffatt": {
    name: "Noel Moffatt",
    slug: "noel-moffatt",
    role: "Content Marketing",
    shortBio: "Noel writes about dock scheduling, yard management, and supply chain efficiency, turning complex logistics topics into actionable insights.",
  },
  "Nick Rakovsky": {
    name: "Nick Rakovsky",
    slug: "nick-rakovsky",
    role: "Co-Founder & CTO",
    shortBio: "Nick co-founded DataDocks and leads the engineering team. He architects the platform that powers dock scheduling for warehouses worldwide.",
    linkedIn: "https://www.linkedin.com/in/nickrakovsky",
  },
  "Tim Branch": {
    name: "Tim Branch",
    slug: "tim-branch",
    role: "Content Marketing",
    shortBio: "Tim focuses on growth strategy and digital marketing at DataDocks, helping warehouses discover smarter dock scheduling.",
  },
  "Jessica Edgson": {
    name: "Jessica Edgson",
    slug: "jessica-edgson",
    role: "Content Writer",
    shortBio: "Jessica creates educational content about logistics technology, helping readers understand how dock scheduling software transforms warehouse operations.",
  },
  "Hunter Branch": {
    name: "Hunter Branch",
    slug: "hunter-branch",
    role: "Marketing Specialist",
    shortBio: "Hunter supports DataDocks marketing efforts with a focus on content creation and audience engagement in the logistics space.",
  },
  "Chris La Porte": {
    name: "Chris La Porte",
    slug: "chris-la-porte",
    role: "Content Writer",
    shortBio: "Chris is a content writer at DataDocks, specializing in translating complex supply chain challenges into practical strategies for warehouse managers and logistics leaders.",
  },
  "DataDocks": {
    name: "Nick Rakovsky",
    slug: "nick-rakovsky",
    role: "Co-Founder & CTO",
    shortBio: "Nick co-founded DataDocks and leads the engineering team. He architects the platform that powers dock scheduling for warehouses worldwide.",
    linkedIn: "https://www.linkedin.com/in/nickrakovsky",
  },
  "Tim Branch & Joe Fitzpatrick": {
    name: "Tim Branch & Joe Fitzpatrick",
    slug: "tim-branch",
    role: "Marketing",
    shortBio: "A collaborative piece from Tim Branch and Joe Fitzpatrick on the DataDocks marketing team.",
  },
};

export function getAuthor(name: string): Author {
  return authors[name] || authors["DataDocks"];
}
