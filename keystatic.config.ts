/// <reference types="vite/client" />
import { config, fields, collection, singleton } from '@keystatic/core';
import { block, inline } from '@keystatic/core/content-components';

const isProd = import.meta.env.PROD;

export default config({
    storage: isProd
        ? {
            kind: 'github',
            repo: 'nickrakovsky/dd_marketing',
        }
        : {
            kind: 'local',
        },

    // 1. SINGLETONS (One-off pages like Settings or Hubs)
    singletons: {
        blogHub: singleton({
            label: 'Blog Hub Settings',
            path: 'src/content/settings/blogHub',
            format: { data: 'json' },
            schema: {
                headline: fields.text({ label: 'Hub Page Headline' }),

                // Here is our layout-saving relationship field!
                featuredPosts: fields.array(
                    fields.relationship({
                        label: 'Select a Featured Post',
                        collection: 'posts',
                    }),
                    {
                        label: 'Featured Posts Carousel',
                        itemLabel: (props) => props.value || 'Select a post',
                        // This forces the CEO to pick EXACTLY 3 posts. No more, no less.
                        validation: { length: { min: 3, max: 3 } }
                    }
                ),
            },
        }),
    },

    // 2. COLLECTIONS (Repeating items like Blog Posts)
    collections: {
        posts: collection({
            label: 'Blog Posts',
            slugField: 'title',
            path: 'src/content/posts/*',
            format: { contentField: ['postType', 'value', 'content'] },
            schema: {
                title: fields.slug({ name: { label: 'Title' } }),
                description: fields.text({ label: 'Short Description', multiline: true }),
                author: fields.text({ label: 'Author Name' }),
                category: fields.select({
                    label: 'Category',
                    options: [
                        { label: 'Carrier Management', value: 'Carrier Management' },
                        { label: 'Facility Operations', value: 'Facility Operations' },
                        { label: 'Supply Chain Strategy', value: 'Supply Chain Strategy' },
                        { label: 'Systems Integration', value: 'Systems Integration' },
                    ],
                    defaultValue: 'Carrier Management',
                }),
                pubDate: fields.text({ label: 'Publish Date' }),
                updatedDate: fields.text({ label: 'Updated Date' }),
                cardImage: fields.image({
                    label: 'Card Image',
                    directory: 'src/assets/blog-images/',
                    publicPath: '../../assets/blog-images/',
                }),
                cardAlt: fields.text({ label: 'Card Image Alt' }),
                readTime: fields.text({ label: 'Read Time (e.g. 5 min read)' }),
                isHighlighted: fields.checkbox({ label: 'Is Highlighted' }),
                priority: fields.select({
                    label: 'Priority',
                    options: [
                        { label: 'High', value: 'High' },
                        { label: 'Medium', value: 'Medium' },
                        { label: 'Low', value: 'Low' },
                    ],
                    defaultValue: 'Medium',
                }),
                showToc: fields.checkbox({ label: 'Show Table of Contents', defaultValue: true }),
                faq: fields.array(
                    fields.object({
                        question: fields.text({ label: 'Question' }),
                        answer: fields.text({ label: 'Answer', multiline: true }),
                    }),
                    {
                        label: 'FAQ Items (Frontmatter)',
                        itemLabel: (props) => props.fields.question.value || 'New FAQ Item',
                    }
                ),
                postType: fields.conditional(
                    fields.select({
                        label: 'Post Type',
                        options: [
                            { label: 'Article', value: 'article' },
                            { label: 'Video', value: 'video' },
                            { label: 'Short', value: 'short' },
                        ],
                        defaultValue: 'article',
                    }),
                    {
                        article: fields.object({
                            content: fields.mdx({
                                label: 'Post Content',
                                components: {
                                    LeadMagnetForm: block({
                                        label: 'Lead Magnet Form',
                                        schema: {
                                            headline: fields.text({ label: 'Headline' }),
                                            eventName: fields.text({ label: 'Event Name' }),
                                            redirectUrl: fields.text({ label: 'Redirect URL' }),
                                            buttonText: fields.text({ label: 'Button Text' }),
                                        }
                                    }),
                                    FAQ: block({
                                        label: 'FAQ Block',
                                        schema: {
                                            faqs: fields.array(
                                                fields.object({
                                                    question: fields.text({ label: 'Question' }),
                                                    answer: fields.text({ label: 'Answer', multiline: true }),
                                                }),
                                                {
                                                    label: 'Items',
                                                    itemLabel: props => props.fields.question.value || 'New Item',
                                                }
                                            )
                                        }
                                    }),
                                    SmartLink: inline({
                                        label: 'Glossary SmartLink',
                                        schema: {
                                            id: fields.relationship({
                                                label: 'Glossary Term',
                                                collection: 'glossary',
                                                validation: { isRequired: true }
                                            }),
                                            anchorText: fields.text({ label: 'Anchor Text' }),
                                        }
                                    })
                                }
                            })
                        }),
                        video: fields.object({
                            youtubeId: fields.text({ label: 'YouTube Video ID' }),
                            duration: fields.text({ label: 'Video Duration (ISO 8601)' }),
                            content: fields.mdx({ 
                                label: 'Video Description',
                                components: {
                                    LeadMagnetForm: block({
                                        label: 'Lead Magnet Form',
                                        schema: {
                                            headline: fields.text({ label: 'Headline' }),
                                            eventName: fields.text({ label: 'Event Name' }),
                                            redirectUrl: fields.text({ label: 'Redirect URL' }),
                                            buttonText: fields.text({ label: 'Button Text' }),
                                        }
                                    }),
                                    SmartLink: inline({
                                        label: 'Glossary SmartLink',
                                        schema: {
                                            id: fields.relationship({
                                                label: 'Glossary Term',
                                                collection: 'glossary',
                                                validation: { isRequired: true }
                                            }),
                                            anchorText: fields.text({ label: 'Anchor Text' }),
                                        }
                                    })
                                }
                            })
                        }),
                        short: fields.object({
                            youtubeId: fields.text({ label: 'YouTube Video ID' }),
                            duration: fields.text({ label: 'Video Duration (ISO 8601)' }),
                            content: fields.mdx({ 
                                label: 'Short Description',
                                components: {
                                    LeadMagnetForm: block({
                                        label: 'Lead Magnet Form',
                                        schema: {
                                            headline: fields.text({ label: 'Headline' }),
                                            eventName: fields.text({ label: 'Event Name' }),
                                            redirectUrl: fields.text({ label: 'Redirect URL' }),
                                            buttonText: fields.text({ label: 'Button Text' }),
                                        }
                                    }),
                                    SmartLink: inline({
                                        label: 'Glossary SmartLink',
                                        schema: {
                                            id: fields.relationship({
                                                label: 'Glossary Term',
                                                collection: 'glossary',
                                                validation: { isRequired: true }
                                            }),
                                            anchorText: fields.text({ label: 'Anchor Text' }),
                                        }
                                    })
                                }
                            })
                        })
                    }
                ),
            },
        }),
        videos: collection({
            label: 'YouTube Videos',
            slugField: 'title',
            path: 'src/content/videos/*',
            format: { contentField: ['postType', 'value', 'content'] },
            schema: {
                title: fields.slug({ name: { label: 'Title' } }),
                description: fields.text({ label: 'Short Description', multiline: true }),
                author: fields.text({ label: 'Author Name' }),
                category: fields.select({
                    label: 'Category',
                    options: [
                        { label: 'Carrier Management', value: 'Carrier Management' },
                        { label: 'Facility Operations', value: 'Facility Operations' },
                        { label: 'Supply Chain Strategy', value: 'Supply Chain Strategy' },
                        { label: 'Systems Integration', value: 'Systems Integration' },
                    ],
                    defaultValue: 'Carrier Management',
                }),
                pubDate: fields.text({ label: 'Publish Date' }),
                updatedDate: fields.text({ label: 'Updated Date' }),
                cardImage: fields.image({
                    label: 'Card Image',
                    directory: 'src/assets/blog-images/',
                    publicPath: '../../assets/blog-images/',
                }),
                cardAlt: fields.text({ label: 'Card Image Alt' }),
                postType: fields.conditional(
                    fields.select({
                        label: 'Post Type',
                        options: [
                            { label: 'Video', value: 'video' },
                            { label: 'Short', value: 'short' },
                        ],
                        defaultValue: 'video',
                    }),
                    {
                        video: fields.object({
                            youtubeId: fields.text({ label: 'YouTube Video ID' }),
                            duration: fields.text({ label: 'Video Duration (ISO 8601)' }),
                            content: fields.mdx({ 
                                label: 'Video Description',
                                components: {
                                    LeadMagnetForm: block({
                                        label: 'Lead Magnet Form',
                                        schema: {
                                            headline: fields.text({ label: 'Headline' }),
                                            eventName: fields.text({ label: 'Event Name' }),
                                            redirectUrl: fields.text({ label: 'Redirect URL' }),
                                            buttonText: fields.text({ label: 'Button Text' }),
                                        }
                                    }),
                                    SmartLink: inline({
                                        label: 'Glossary SmartLink',
                                        schema: {
                                            id: fields.relationship({
                                                label: 'Glossary Term',
                                                collection: 'glossary',
                                                validation: { isRequired: true }
                                            }),
                                            anchorText: fields.text({ label: 'Anchor Text' }),
                                        }
                                    })
                                }
                            })
                        }),
                        short: fields.object({
                            youtubeId: fields.text({ label: 'YouTube Video ID' }),
                            duration: fields.text({ label: 'Video Duration (ISO 8601)' }),
                            content: fields.mdx({ 
                                label: 'Short Description',
                                components: {
                                    LeadMagnetForm: block({
                                        label: 'Lead Magnet Form',
                                        schema: {
                                            headline: fields.text({ label: 'Headline' }),
                                            eventName: fields.text({ label: 'Event Name' }),
                                            redirectUrl: fields.text({ label: 'Redirect URL' }),
                                            buttonText: fields.text({ label: 'Button Text' }),
                                        }
                                    }),
                                    SmartLink: inline({
                                        label: 'Glossary SmartLink',
                                        schema: {
                                            id: fields.relationship({
                                                label: 'Glossary Term',
                                                collection: 'glossary',
                                                validation: { isRequired: true }
                                            }),
                                            anchorText: fields.text({ label: 'Anchor Text' }),
                                        }
                                    })
                                }
                            })
                        })
                    }
                ),
            },
        }),
        microApp: collection({
            label: 'Micro Apps',
            slugField: 'title',
            path: 'src/content/micro-app/*',
            format: { contentField: 'content' },
            schema: {
                title: fields.slug({ name: { label: 'Title' } }),
                description: fields.text({ label: 'Short Description', multiline: true }),
                pubDate: fields.text({ label: 'Publish Date' }),
                cardImage: fields.image({
                    label: 'Card Image',
                    directory: 'src/assets/blog-images/',
                    publicPath: '../../assets/blog-images/',
                }),
                cardAlt: fields.text({ label: 'Card Image Alt' }),
                content: fields.mdx({
                    label: 'App Content',
                    components: {
                        LeadMagnetForm: block({
                            label: 'Lead Magnet Form',
                            schema: {
                                headline: fields.text({ label: 'Headline' }),
                                eventName: fields.text({ label: 'Event Name' }),
                                redirectUrl: fields.text({ label: 'Redirect URL' }),
                                buttonText: fields.text({ label: 'Button Text' }),
                            }
                        }),
                        SmartLink: inline({
                            label: 'Glossary SmartLink',
                            schema: {
                                id: fields.relationship({
                                    label: 'Glossary Term',
                                    collection: 'glossary',
                                    validation: { isRequired: true }
                                }),
                                anchorText: fields.text({ label: 'Anchor Text' }),
                            }
                        })
                    }
                }),
            },
        }),
        glossary: collection({
            label: 'Glossary',
            slugField: 'termName',
            path: 'src/content/glossary/*',
            format: { data: 'json' },
            schema: {
                termName: fields.slug({ name: { label: 'Term Name' } }),
                contextSnippet: fields.text({ 
                    label: 'Context Snippet', 
                    description: 'A 1-2 sentence definition for the tooltip/bottom sheet.',
                    multiline: true 
                }),
                targetPost: fields.relationship({
                    label: 'Target Post',
                    description: 'The deep-dive article this term should link to.',
                    collection: 'posts',
                    validation: { isRequired: true }
                }),
            }
        }),
    },
});