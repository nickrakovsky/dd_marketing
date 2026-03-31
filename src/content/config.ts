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

export const collections = {
    'posts': postsCollection,
};