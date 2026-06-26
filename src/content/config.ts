import { z, defineCollection, reference } from 'astro:content';

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
        // FAQ array for FAQPage schema. Content must mirror the visible FAQ
        // section in the MDX body (Google requires visible matching content).
        faq: z.array(z.object({
            question: z.string(),
            answer: z.string(),
        })).optional(),
    })
});

const featuresCollection = defineCollection({
    type: 'content',
    schema: () => z.object({
        title: z.string(),
        description: z.string().optional(),
        pubDate: z.coerce.date().optional(),
        icon: z.string().optional(),
        videoUrl: z.string().optional(),
        faq: z.array(z.object({
            question: z.string(),
            answer: z.string(),
        })).optional(),
        testimonial: z.object({
            quote: z.string(),
            author: z.string(),
            role: z.string(),
            company: z.string().optional()
        }).optional(),
        bentoContent: z.object({
            layoutConfig: z.object({
                dataVizColSpan: z.number().optional(),
                implementationColSpan: z.number().optional(),
                differentiationColSpan: z.number().optional(),
                businessImpactColSpan: z.number().optional(),
                dataVizRowSpan: z.number().optional(),
                implementationRowSpan: z.number().optional(),
                differentiationRowSpan: z.number().optional(),
                businessImpactRowSpan: z.number().optional(),
                dataVizOrder: z.number().optional(),
                implementationOrder: z.number().optional(),
                differentiationOrder: z.number().optional(),
                businessImpactOrder: z.number().optional(),
                dataVizPadding: z.string().optional()
            }).optional(),
            implementation: z.string(),
            differentiation: z.string(),
            businessImpact: z.string(),
            vision: z.string().optional(),
            tableContext: z.string().optional(),
            visionSegue: z.string().optional(),
            dataViz: z.object({
                type: z.enum(['mermaid', 'image']),
                content: z.string(),
                caption: z.string().optional()
            }).optional(),
            table: z.object({
                title: z.string().optional(),
                headers: z.array(z.string()),
                rows: z.array(z.array(z.string()))
            }).optional()
        }).optional(),
        microApp: z.string().optional(),
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
        overview: z.string().optional(),
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

const microAppCollection = defineCollection({
    type: 'content',
    schema: ({ image }) => z.object({
        title: z.string(),
        description: z.string().optional(),
        pubDate: z.coerce.date(),
        cardImage: image().optional(),
        cardAlt: z.string().optional(),
    })
});

const glossaryCollection = defineCollection({
    type: 'data',
    schema: z.object({
        termName: z.string(),
        contextSnippet: z.string(),
        targetPost: reference('posts'),
    })
});

export const collections = {
    'posts': postsCollection,
    'videos': videosCollection,
    'features': featuresCollection,
    'integrations': integrationsCollection,
    'settings': settingsCollection,
    'micro-app': microAppCollection,
    'glossary': glossaryCollection,
};