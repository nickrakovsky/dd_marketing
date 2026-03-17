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
        // The image() helper automatically resolves string paths into optimized Astro Image objects!
        coverImage: image().optional(),
        readTime: z.string().optional(),
        showToc: z.boolean().optional(),
    })
});

export const collections = {
    'posts': postsCollection,
};