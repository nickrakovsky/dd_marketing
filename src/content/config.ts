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

        // --- THE NEW BENTO FIELDS ---
        // 'article' is default. 'video' is 16:9. 'short' is 9:16.
        contentType: z.enum(['article', 'video', 'short']).default('article'),
        // The 11-character YouTube ID (e.g., "dQw4w9WgXcQ")
        youtubeId: z.string().optional(),
        // ISO 8601 duration for VideoObject schema (e.g., "PT13M25S")
        duration: z.string().optional(),
        // Priority for sorting or hiding, but not displayed to end user.
        priority: z.string().optional(),
    })
});

export const collections = {
    'posts': postsCollection,
};