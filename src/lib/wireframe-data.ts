import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import fs from 'node:fs';
import path from 'node:path';
import { isPublished } from './content-status';

export interface GuideItem {
  slug: string;
  title: string;
  kicker?: string;
  description: string;
  url: string;
  displayDate: string;
  author: string;
  cardImage?: any;
  cardAlt?: string;
  readTime?: string;
  isCustomPage?: boolean;
}

export interface LiveFeedItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  url: string;
  displayDate: string;
  author: string;
  cardImage?: any;
  cardAlt?: string;
  readTime?: string;
  postType: 'article' | 'video' | 'short';
  rawTitle?: string;
  youtubeId?: string;
  duration?: string;
  pubDateValue: number;
}

export const BASE_EVERGREEN_SLUGS: string[] = [
  'best-yard-management-options',
  'logistics-coordinator-career-path',
  'warehouse-audit-checklist',
  'yard-management-process-flow',
  'warehouse-management-career',
  'retail-case-studies',
  'warehouse-receiving-process',
  'what-is-dock-scheduling',
  'warehouse-motivation',
  'lumper-services'
];

export function formatDateString(date: Date | string | undefined, prefix?: string): string {
  if (!date) return prefix ? `${prefix} Recently` : 'Recently';
  const d = new Date(date);
  const formatted = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  return prefix ? `${prefix} ${formatted}` : formatted;
}

export function formatVideoDuration(dur?: string, isShort = false): string {
  if (!dur || dur.trim() === '') {
    return isShort ? '< 1 min watch' : '10 min watch';
  }
  
  // Parse ISO 8601 duration: e.g. PT10M56S, PT0M44S, PT1H2M30S, PT1M12S
  const match = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (!match) {
    return isShort ? '< 1 min watch' : '5 min watch';
  }

  const hours = parseInt(match[1] || '0', 10);
  const mins = parseInt(match[2] || '0', 10);
  const secs = parseInt(match[3] || '0', 10);

  const totalSeconds = hours * 3600 + mins * 60 + secs;

  if (totalSeconds < 60) {
    return '< 1 min watch';
  }

  const roundedMins = Math.max(1, Math.round(totalSeconds / 60));
  return `${roundedMins} min watch`;
}

export function getEstimatedReadTime(body?: string, fallback = '4 min read'): string {
  if (!body) return fallback;
  const words = body.replace(/[^\w\s]/g, '').trim().split(/\s+/).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
}

export async function getKnowledgeHubData() {
  const allPosts = (await getCollection('posts')).filter(p => isPublished(p.data.pubDate));
  let allVideos: CollectionEntry<'videos'>[] = [];
  try {
    allVideos = (await getCollection('videos')).filter(v => isPublished(v.data.pubDate));
  } catch (e) {
    allVideos = [];
  }

  // 1. Check for /comparison page existence
  const comparisonPageExists = 
    fs.existsSync(path.resolve('./src/pages/comparison.astro')) ||
    fs.existsSync(path.resolve('./src/pages/comparison/index.astro')) ||
    allPosts.some(p => p.slug === 'comparison');

  // Build the list of evergreen guide definitions
  const guideCandidates: GuideItem[] = [];

  // /datadocks-vs-opendock is always a core comparison guide
  guideCandidates.push({
    slug: 'datadocks-vs-opendock',
    title: 'DataDocks vs OpenDock: Dock Scheduling Comparison',
    description: 'A detailed operational comparison of features, custom rules, multi-facility scalability, and carrier onboarding for high-volume facilities.',
    url: '/datadocks-vs-opendock',
    displayDate: 'Updated Aug 12, 2026',
    author: 'DataDocks Operations Team',
    readTime: '6 min read',
    isCustomPage: true
  });

  // If /comparison is published, insert it right after vs-opendock
  if (comparisonPageExists) {
    guideCandidates.push({
      slug: 'comparison',
      title: 'Dock Scheduling Software Comparison Guide',
      description: 'Side-by-side evaluation of leading warehouse dock scheduling and yard management software platforms.',
      url: '/comparison',
      displayDate: 'Updated Aug 2026',
      author: 'DataDocks Operations Team',
      readTime: '8 min read',
      isCustomPage: true
    });
  }

  // Add the base evergreen post entries
  for (const slug of BASE_EVERGREEN_SLUGS) {
    const post = allPosts.find(p => p.slug === slug);
    if (post) {
      guideCandidates.push({
        slug: post.slug,
        title: post.data.title,
        description: post.data.description || 'In-depth guide covering key warehouse workflows and dock management strategies.',
        url: `/posts/${post.slug}`,
        displayDate: formatDateString(post.data.updatedDate || post.data.pubDate, 'Updated'),
        author: post.data.author || 'Joe Fitzpatrick',
        cardImage: post.data.cardImage,
        cardAlt: post.data.cardAlt || post.data.title,
        readTime: post.data.readTime || getEstimatedReadTime(post.body),
        isCustomPage: false
      });
    }
  }

  // Exactly 10 guides max in the Playbooks & Guides section (pushes #10 out when new comparison guides exist)
  const evergreenGuides = guideCandidates.slice(0, 10);
  const evergreenSlugSet = new Set(evergreenGuides.map(g => g.slug));

  // 2. Build Live Feed (All non-evergreen posts, videos, and shorts)
  const liveFeedItems: LiveFeedItem[] = [];

  // Add posts
  for (const post of allPosts) {
    if (evergreenSlugSet.has(post.slug)) continue;

    let pType: 'article' | 'video' | 'short' = 'article';
    let yId: string | undefined = undefined;
    let rawDur: string | undefined = undefined;

    if (post.data.postType) {
      pType = post.data.postType.discriminant;
      if (post.data.postType.value && 'youtubeId' in post.data.postType.value) {
        yId = post.data.postType.value.youtubeId;
        rawDur = 'duration' in post.data.postType.value ? post.data.postType.value.duration : undefined;
      }
    } else if ((post.data as any).contentType === 'short' || (post.data as any).contentType === 'video') {
      pType = (post.data as any).contentType;
      yId = (post.data as any).youtubeId;
    }

    const isVideoItem = pType === 'video' || pType === 'short';
    const author = isVideoItem ? 'Nick Rakovsky, CEO' : (post.data.author || 'DataDocks');
    const readTime = isVideoItem 
      ? formatVideoDuration(rawDur, pType === 'short')
      : (post.data.readTime || getEstimatedReadTime(post.body));

    liveFeedItems.push({
      id: `post-${post.slug}`,
      slug: post.slug,
      title: post.data.title,
      description: post.data.description || 'Read practical operational takeaways and warehouse strategies.',
      url: `/posts/${post.slug}`,
      displayDate: formatDateString(post.data.pubDate), // No 'Published' prefix
      author,
      cardImage: post.data.cardImage,
      cardAlt: post.data.cardAlt || post.data.title,
      readTime,
      postType: pType,
      youtubeId: yId,
      duration: rawDur,
      pubDateValue: new Date(post.data.pubDate).valueOf()
    });
  }

  // Add standalone video collection entries
  for (const video of allVideos) {
    if (evergreenSlugSet.has(video.slug)) continue;

    const pType: 'article' | 'video' | 'short' = 
      video.data.postType?.discriminant === 'short' ? 'short' : 'video';
    
    let yId: string | undefined = undefined;
    let rawDur: string | undefined = undefined;
    if (video.data.postType?.value && 'youtubeId' in video.data.postType.value) {
      yId = video.data.postType.value.youtubeId;
      rawDur = 'duration' in video.data.postType.value ? video.data.postType.value.duration : undefined;
    }

    const readTime = formatVideoDuration(rawDur, pType === 'short');

    liveFeedItems.push({
      id: `video-${video.slug}`,
      slug: video.slug,
      title: video.data.title,
      description: video.data.description || 'Watch practical video breakdown on warehouse operations.',
      url: `/videos/${video.slug}`,
      displayDate: formatDateString(video.data.pubDate), // No 'Published' prefix
      author: 'Nick Rakovsky, CEO', // Videos authored by Nick Rakovsky, CEO
      cardImage: video.data.cardImage,
      cardAlt: video.data.cardAlt || video.data.title,
      readTime,
      postType: pType,
      youtubeId: yId,
      duration: rawDur,
      pubDateValue: new Date(video.data.pubDate).valueOf()
    });
  }

  // Sort live feed chronologically (newest first)
  liveFeedItems.sort((a, b) => b.pubDateValue - a.pubDateValue);

  // 3. Load Features
  const features = await getCollection('features');
  const featureList = features.map(f => ({
    slug: f.slug,
    title: f.data.title,
    description: f.data.description || 'Learn how DataDocks streamlines dock and yard workflows.',
    url: `/datadocks-features/${f.slug}`,
    icon: f.data.icon
  }));

  // 4. Define Benefits
  const benefitsList = [
    {
      title: 'Increase Capacity',
      description: 'Optimize appointment durations based on real load data to process more trucks per dock without added labour.',
      url: '/benefits/increase-capacity',
      tag: 'Throughput & Efficiency'
    },
    {
      title: 'See Everything',
      description: 'Real-time dock and yard visibility across every trailer, appointment status, and door occupancy.',
      url: '/benefits/see-everything',
      tag: 'Yard & Schedule Visibility'
    },
    {
      title: 'Delight Carriers',
      description: 'Give carriers self-service 24/7 appointment scheduling with instant confirmation and reduced gate wait times.',
      url: '/benefits/delight-carriers',
      tag: 'Carrier Experience'
    },
    {
      title: 'Digitize Operations',
      description: 'Eliminate manual clipboards, Excel sheets, and email back-and-forth with automated digital schedules.',
      url: '/benefits/digitize-operations',
      tag: 'Digital Transformation'
    }
  ];

  return {
    evergreenGuides,
    liveFeedItems,
    featureList,
    benefitsList
  };
}

function cleanVideoTitle(rawTitle: string): string {
  const titleMap: Record<string, string> = {
    'The Hidden Cost of Your Outbound Logistics #operationsmanagement': 'The Hidden Cost of Outbound Logistics',
    '2 Hours Waiting v.s.. 2 Mins Booking: What Drivers Really Want': '2 Hours Waiting vs. 2 Mins Booking',
    'Stop Carrier No-Shows: Tracking Third-Party Trucks When GPS Fails': 'Tracking Third-Party Trucks When GPS Fails',
    'Why Is Your Warehouse Shift Always Behind? 📉⏱️': 'Why Your Warehouse Shift Falls Behind',
    "Remember When Your Boss Ignored You? Don't Be That Guy. 🚫 #logisticsleadership": 'Listen to Your Warehouse Floor',
    '"Shrinkage" is Just a Nice Word for Theft 🕵️‍♂️ #inventorymanagement': 'Addressing Warehouse Shrinkage',
    'You need a "slow lane" and a "fast lane " in your loading dock. Here\'s why.': 'Slow Lanes vs. Fast Lanes on the Dock',
    'Warehouse Leadership: The Power of the Shout-Out 📢 #WarehouseManager': 'The Power of the Floor Shout-Out',
    'Fix Your Warehouse Flow: 2 Simple Yard Management Tips 🚛⏱️': '2 Simple Yard Management Fixes',
    'Stop Letting Carriers Dictate Your Warehouse Schedule': 'Stop Letting Carriers Dictate Your Schedule',
    'Just Been Promoted to Warehouse Manager? Watch this ASAP #warehouseoperations': 'First 90 Days as Warehouse Manager'
  };

  if (titleMap[rawTitle]) return titleMap[rawTitle];

  return rawTitle
    .replace(/#\w+/g, '')
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/^["']|["']$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function getModularHubData() {
  const allPosts = (await getCollection('posts')).filter(p => isPublished(p.data.pubDate));
  let allVideos: CollectionEntry<'videos'>[] = [];
  try {
    allVideos = (await getCollection('videos')).filter(v => isPublished(v.data.pubDate));
  } catch (e) {
    allVideos = [];
  }

  const findPost = (slug: string): GuideItem => {
    if (slug === 'datadocks-vs-opendock') {
      return {
        slug: 'datadocks-vs-opendock',
        title: 'DataDocks vs OpenDock: Full Comparison',
        description: 'A detailed operational comparison of features, custom rules, multi-facility scalability, and carrier onboarding for high-volume facilities.',
        url: '/datadocks-vs-opendock',
        displayDate: 'Updated Aug 2026',
        author: 'DataDocks Operations Team',
        readTime: '6 min read',
        isCustomPage: true
      };
    }

    if (slug === 'comparison') {
      return {
        slug: 'comparison',
        title: 'Dock Scheduling Software Comparison',
        description: 'Comprehensive, side-by-side evaluation of leading warehouse dock scheduling and yard management software platforms.',
        url: '/comparison',
        displayDate: 'Updated Sep 2026',
        author: 'DataDocks Operations Team',
        readTime: '8 min read',
        isCustomPage: true
      };
    }

    if (slug === 'carrier-portal' || slug === 'datadocks-features/carrier-portal') {
      return {
        slug: 'carrier-portal',
        title: 'Carrier Portal',
        description: 'Self-service appointment scheduling portal for carriers with 24/7 access, instant confirmations, and zero driver logins.',
        url: '/datadocks-features/carrier-portal',
        displayDate: 'Platform Feature',
        author: 'DataDocks',
        readTime: '4 min read',
        isCustomPage: true
      };
    }

    if (slug === 'notifications' || slug === 'datadocks-features/notifications') {
      return {
        slug: 'notifications',
        title: 'Automated Notifications',
        description: 'Real-time SMS and email alerts keep drivers, dispatchers, and warehouse teams informed across arrivals and delays.',
        url: '/datadocks-features/notifications',
        displayDate: 'Platform Feature',
        author: 'DataDocks',
        readTime: '3 min read',
        isCustomPage: true
      };
    }

    const post = allPosts.find(p => p.slug === slug);
    if (!post) {
      return {
        slug,
        title: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        description: 'Comprehensive operational guide and industry best practices.',
        url: `/posts/${slug}`,
        displayDate: 'Updated Recently',
        author: 'DataDocks',
        readTime: '5 min read',
        isCustomPage: false
      };
    }

    // Clean, robust descriptions (avoid grabbing raw markdown image alt text or JSX tags)
    let description = post.data.description || 'Comprehensive operational guide and industry best practices.';
    if (slug === 'yard-management-process-flow') {
      description = 'Managing a warehouse yard is ultimately about controlling the flow of trucks, trailers, and people so that inbound and outbound shipments move on schedule. When the yard isn’t running smoothly, detention fees increase, docks sit idle, and warehouse throughput slows down. A clear yard management process flow ensures drivers know where to go, teams know what to do next, and every trailer is visible and accounted for in real time.';
    } else if (slug === 'warehouse-management-career') {
      description = 'A complete guide to Warehouse Management careers in 2026. Learn the skills, certifications, and strategies to advance from Supervisor to Director of Operations.';
    }

    return {
      slug: post.slug,
      title: post.data.title,
      description,
      url: `/posts/${post.slug}`,
      displayDate: formatDateString(post.data.updatedDate || post.data.pubDate, 'Updated'),
      author: post.data.author || 'Joe Fitzpatrick',
      cardImage: post.data.cardImage,
      cardAlt: post.data.cardAlt || post.data.title,
      readTime: post.data.readTime || getEstimatedReadTime(post.body),
      isCustomPage: false
    };
  };

  // Top 3 Evergreens with concise titles and pre-titles
  const evergreen1: GuideItem = {
    ...findPost('best-yard-management-options'),
    kicker: 'Find the right fit for your operations',
    title: 'Yard Management Systems'
  };

  const evergreen2: GuideItem = {
    ...findPost('comparison'),
    kicker: 'In-depth tool comparison',
    title: 'Dock Scheduling'
  };

  const evergreen3: GuideItem = {
    ...findPost('warehouse-audit-checklist'),
    kicker: 'Step-by-step facility review',
    title: 'Warehouse Audit Checklist'
  };

  // Downstream evergreens from user's curated priority list
  const evergreen4 = findPost('yard-management-process-flow');
  const evergreen5 = findPost('warehouse-management-career');
  const evergreen6: GuideItem = {
    ...findPost('datadocks-vs-opendock'),
    title: 'DataDocks vs OpenDock',
    description: 'Head-to-head comparison of custom rules, multi-facility scalability, and driver onboarding.'
  };
  const evergreen7: GuideItem = {
    ...findPost('carrier-portal'),
    title: 'Carrier Portal',
    description: '24/7 self-service scheduling portal with zero driver logins and instant appointment confirmation.'
  };
  const evergreen8: GuideItem = {
    ...findPost('notifications'),
    title: 'Automated Notifications',
    description: 'Real-time SMS and email updates to eliminate carrier email chaos and resolve arrival delays.'
  };
  const evergreen9 = findPost('truck-detention-accessorial-fees');

  // Foundational Guides (Section 11)
  const foundationalGuides: GuideItem[] = [
    findPost('retail-case-studies'),
    findPost('what-is-dock-scheduling'),
    findPost('warehouse-receiving-process'),
    findPost('what-is-a-supply-chain-center-of-excellence')
  ];

  const evergreenSlugs = new Set([
    'best-yard-management-options',
    'comparison',
    'warehouse-audit-checklist',
    'yard-management-process-flow',
    'warehouse-management-career',
    'datadocks-vs-opendock',
    'carrier-portal',
    'notifications',
    'truck-detention-accessorial-fees',
    'retail-case-studies',
    'what-is-dock-scheduling',
    'warehouse-receiving-process',
    'what-is-a-supply-chain-center-of-excellence'
  ]);

  // Non-evergreen posts
  const nonEvergreenPosts = allPosts
    .filter(p => !evergreenSlugs.has(p.slug))
    .sort((a, b) => new Date(b.data.pubDate).valueOf() - new Date(a.data.pubDate).valueOf());

  // 5 most recent posts for split section left side
  const latest5Posts: LiveFeedItem[] = nonEvergreenPosts.slice(0, 5).map(post => ({
    id: `latest-${post.slug}`,
    slug: post.slug,
    title: post.data.title,
    description: post.data.description || '',
    url: `/posts/${post.slug}`,
    displayDate: formatDateString(post.data.pubDate),
    author: post.data.author || 'DataDocks',
    cardImage: post.data.cardImage,
    cardAlt: post.data.cardAlt || post.data.title,
    readTime: post.data.readTime || getEstimatedReadTime(post.body),
    postType: 'article' as const,
    pubDateValue: new Date(post.data.pubDate).valueOf()
  }));

  // Shorts with clean, professional, concise titles
  const founderShorts: LiveFeedItem[] = allVideos
    .filter(v => v.data.postType?.discriminant === 'short')
    .sort((a, b) => new Date(b.data.pubDate).valueOf() - new Date(a.data.pubDate).valueOf())
    .map(v => {
      const yId = v.data.postType?.value && 'youtubeId' in v.data.postType.value ? v.data.postType.value.youtubeId : undefined;
      const dur = v.data.postType?.value && 'duration' in v.data.postType.value ? v.data.postType.value.duration : undefined;
      const cleanTitle = cleanVideoTitle(v.data.title);
      const rawTitle = v.data.title
        .replace(/#\w+/g, '')
        .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
        .replace(/^["']|["']$/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      return {
        id: `short-${v.slug}`,
        slug: v.slug,
        title: cleanTitle,
        rawTitle,
        description: v.data.description || '',
        url: `/videos/${v.slug}`,
        displayDate: formatDateString(v.data.pubDate),
        author: 'Nick Rakovsky, CEO',
        cardImage: v.data.cardImage,
        cardAlt: v.data.cardAlt || v.data.title,
        readTime: formatVideoDuration(dur, true),
        postType: 'short' as const,
        youtubeId: yId,
        duration: dur,
        pubDateValue: new Date(v.data.pubDate).valueOf()
      };
    });

  // Longform Videos (2 most recent for Deep Dives section)
  const longformVideos: LiveFeedItem[] = allVideos
    .filter(v => v.data.postType?.discriminant === 'video')
    .sort((a, b) => new Date(b.data.pubDate).valueOf() - new Date(a.data.pubDate).valueOf())
    .map(v => {
      const yId = v.data.postType?.value && 'youtubeId' in v.data.postType.value ? v.data.postType.value.youtubeId : undefined;
      const dur = v.data.postType?.value && 'duration' in v.data.postType.value ? v.data.postType.value.duration : undefined;

      // Clean, complete operational description ending with a period and no ellipsis
      let cleanDesc = v.data.description || '';
      if (v.slug.includes('carrier-email') || v.data.title.includes('Stop Letting Carrier Emails')) {
        cleanDesc = 'When dock scheduling runs through email, a single change causes hours of back-and-forth, missing paperwork, and expensive detention fees. In this walkthrough, Nick explains why email scheduling fails at scale and how automated self-service booking keeps your dock on schedule.';
      } else if (v.slug.includes('dock-congestion') || v.data.title.includes('4 Ways to Cut Dock Congestion')) {
        cleanDesc = 'Dock congestion usually looks like a capacity shortage when the real problem is how arrival slots are scheduled across the doors you already have. Nick shares four practical adjustments to balance truck flow, eliminate yard gridlock, and move more freight without adding shifts.';
      } else {
        cleanDesc = cleanDesc
          .replace(/^[💡⏱️📈🚚📢\s]+/, '')
          .replace(/https?:\/\/\S+/g, '')
          .replace(/\.{2,}$/, '.')
          .trim();
        if (!cleanDesc.endsWith('.')) cleanDesc += '.';
      }

      return {
        id: `video-${v.slug}`,
        slug: v.slug,
        title: v.data.title,
        description: cleanDesc,
        url: `/videos/${v.slug}`,
        displayDate: formatDateString(v.data.pubDate),
        author: 'Nick Rakovsky, CEO',
        cardImage: v.data.cardImage,
        cardAlt: v.data.cardAlt || v.data.title,
        readTime: formatVideoDuration(dur, false),
        postType: 'video' as const,
        youtubeId: yId,
        duration: dur,
        pubDateValue: new Date(v.data.pubDate).valueOf()
      };
    });

  const deepDiveVideos = longformVideos.slice(0, 2);

  // Older resources: remaining posts + remaining longform videos + shorts
  const remainingPosts: LiveFeedItem[] = nonEvergreenPosts.slice(5).map(post => ({
    id: `archive-${post.slug}`,
    slug: post.slug,
    title: post.data.title,
    description: post.data.description || '',
    url: `/posts/${post.slug}`,
    displayDate: formatDateString(post.data.pubDate),
    author: post.data.author || 'DataDocks',
    cardImage: post.data.cardImage,
    cardAlt: post.data.cardAlt || post.data.title,
    readTime: post.data.readTime || getEstimatedReadTime(post.body),
    postType: 'article' as const,
    pubDateValue: new Date(post.data.pubDate).valueOf()
  }));

  const remainingVideos = longformVideos.slice(2);

  const olderResources = [...remainingPosts, ...remainingVideos]
    .sort((a, b) => b.pubDateValue - a.pubDateValue);

  return {
    evergreen1,
    evergreen2,
    evergreen3,
    evergreen4,
    evergreen5,
    evergreen6,
    evergreen7,
    evergreen8,
    evergreen9,
    foundationalGuides,
    latest5Posts,
    founderShorts,
    deepDiveVideos,
    olderResources
  };
}

// Backward compatibility for wireframe pages if needed
export async function getWireframeData() {
  const data = await getKnowledgeHubData();
  return {
    allPosts: [],
    evergreenPosts: data.evergreenGuides.map((g, idx) => ({
      ...g,
      rank: idx + 1,
      topic: 'Operations',
      data: {
        title: g.title,
        description: g.description,
        cardImage: g.cardImage,
        cardAlt: g.cardAlt,
        author: g.author,
        readTime: g.readTime
      }
    })),
    discoverPosts: data.liveFeedItems.map(item => ({
      ...item,
      topic: 'Logistics',
      data: {
        title: item.title,
        description: item.description,
        cardImage: item.cardImage,
        cardAlt: item.cardAlt,
        author: item.author,
        readTime: item.readTime
      }
    })),
    topics: ['All Topics', 'Load Visibility', 'Drop Trailers', 'SCM Software', 'API Automation', 'Road Carriers', 'Ops Workforce', 'KPIs & Audits']
  };
}

