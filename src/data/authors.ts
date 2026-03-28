export interface Author {
  name: string;
  slug: string;
  role: string;
  shortBio: string;
}

export const authors: Record<string, Author> = {
  "Joe Fitzpatrick": {
    name: "Joe Fitzpatrick",
    slug: "joe-fitzpatrick",
    role: "Co-Founder & CEO",
    shortBio: "Joe co-founded DataDocks in 2013 to solve the dock scheduling chaos he witnessed firsthand in logistics. He leads company strategy and product vision.",
  },
  "Noel Moffatt": {
    name: "Noel Moffatt",
    slug: "noel-moffatt",
    role: "Content Marketing Manager",
    shortBio: "Noel writes about dock scheduling, yard management, and supply chain efficiency, turning complex logistics topics into actionable insights.",
  },
  "Nick Rakovsky": {
    name: "Nick Rakovsky",
    slug: "nick-rakovsky",
    role: "Co-Founder & CTO",
    shortBio: "Nick co-founded DataDocks and leads the engineering team. He architects the platform that powers dock scheduling for warehouses worldwide.",
  },
  "Tim Branch": {
    name: "Tim Branch",
    slug: "tim-branch",
    role: "Marketing Lead",
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
  "DataDocks": {
    name: "Nick Rakovsky",
    slug: "nick-rakovsky",
    role: "Co-Founder & CTO",
    shortBio: "Nick co-founded DataDocks and leads the engineering team. He architects the platform that powers dock scheduling for warehouses worldwide.",
  },
  "Tim Branch & Joe Fitzpatrick": {
    name: "Tim Branch & Joe Fitzpatrick",
    slug: "tim-branch",
    role: "Marketing Lead & Co-Founder",
    shortBio: "A collaborative piece from Tim Branch and Joe Fitzpatrick combining marketing insight with founder expertise.",
  },
};

export function getAuthor(name: string): Author {
  return authors[name] || authors["DataDocks"];
}
