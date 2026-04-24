import { z, defineCollection } from 'astro:content';

const postsCollection = defineCollection({
    type: 'content',
    schema: ({ image }) => z.object({
        title: z.string(),
        description: z.string().optional(),
        // z.coerce.date() forces Webflow's weird string dates into standard Date objects
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        author: z.string(),
        category: z.string().optional(),
        cardImage: image().optional(),
        cardAlt: z.string().optional(),
        readTime: z.string().optional(),
        showToc: z.boolean().optional(),

        postType: z.discriminatedUnion('discriminant', [
            z.object({
                discriminant: z.literal('article'),
                value: z.object({}).optional()
            }),
            z.object({
                discriminant: z.literal('video'),
                value: z.object({
                    youtubeId: z.string().optional(),
                    duration: z.string().optional()
                })
            }),
            z.object({
                discriminant: z.literal('short'),
                value: z.object({
                    youtubeId: z.string().optional(),
                    duration: z.string().optional()
                })
            })
        ]).default({ discriminant: 'article', value: {} }),
        // Priority for sorting or hiding, but not displayed to end user.
        priority: z.string().optional(),
    })
});

const featuresCollection = defineCollection({
    type: 'content',
    schema: () => z.object({
        title: z.string(),
        description: z.string().optional(),
        pubDate: z.coerce.date().optional(),
        icon: z.string().optional(),
        videoUrl: z.string().optional()
    })
});

const integrationsCollection = defineCollection({
    type: 'content',
    schema: () => z.object({
        title: z.string(),
        pageTitle: z.string().optional(),
        description: z.string().optional(),
        pubDate: z.coerce.date().optional(),
        icon: z.string().optional(),
        heroBody: z.string().optional(),
        advantagesTitle: z.string().optional(),
        disclaimer: z.string().optional(),
        benefits: z.array(z.object({
            title: z.string().optional(),
            text: z.string().optional(),
            icon: z.string().optional(),
        })).optional()
    })
});

const settingsCollection = defineCollection({
    type: 'data',
    schema: z.object({
        headline: z.string(),
        featuredPosts: z.array(z.string()),
    })
});

const videosCollection = defineCollection({
    type: 'content',
    schema: ({ image }) => z.object({
        title: z.string(),
        description: z.string().optional(),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        author: z.string(),
        category: z.string().optional(),
        cardImage: image().optional(),
        cardAlt: z.string().optional(),
        postType: z.discriminatedUnion('discriminant', [
            z.object({
                discriminant: z.literal('video'),
                value: z.object({
                    youtubeId: z.string().optional(),
                    duration: z.string().optional()
                })
            }),
            z.object({
                discriminant: z.literal('short'),
                value: z.object({
                    youtubeId: z.string().optional(),
                    duration: z.string().optional()
                })
            })
        ]).default({ discriminant: 'video', value: {} }),
    })
});

export const collections = {
    'posts': postsCollection,
    'videos': videosCollection,
    'features': featuresCollection,
    'integrations': integrationsCollection,
    'settings': settingsCollection,
};