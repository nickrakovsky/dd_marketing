/// <reference types="vite/client" />
import { config, fields, collection, singleton } from '@keystatic/core';
import { block, inline, mark, wrapper } from '@keystatic/core/content-components';

const isProd = import.meta.env.PROD;

// Body images must point at the same directory/publicPath the MDX files already
// use, otherwise the editor cannot resolve `![alt](../../assets/blog-images/x.webp)`
// to a real asset and rewrites it as escaped literal text (`!\[alt]\(...)`) on save.
const mdxImageOptions = {
    directory: 'src/assets/blog-images/',
    publicPath: '../../assets/blog-images/',
};

// Every component that appears in an MDX body MUST be declared here. Keystatic's
// editor parses the body against this map and throws "Missing component
// definition for X" on anything undeclared, which makes the entry unopenable in
// the CMS. Keep in sync with the `components={{ ... }}` maps in
// src/pages/posts/[slug].astro, src/pages/videos/[slug].astro and
// src/pages/micro-apps/[slug].astro.
//
// The editor also cannot parse ESM `import`/`export` statements inside MDX
// bodies ("Unhandled type mdxjsEsm"), so components must be supplied via those
// Astro render maps rather than imported in the MDX itself.
const mdxComponents = {
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
    }),
    RelatedFeatureCallout: block({
        label: 'Related Feature Callout',
        schema: {
            id: fields.text({ label: 'Feature ID' }),
        }
    }),
    // Superscript citation marker, e.g. <Cite id="3" />.
    Cite: inline({
        label: 'Citation Marker',
        schema: {
            id: fields.text({ label: 'Reference Number' }),
        }
    }),
    // A bibliography entry. Declared as a `mark` rather than `wrapper`/`block`
    // because these are authored on a single line with inline children, which
    // MDX parses as an inline (mdxJsxTextElement) node — the block-level forms
    // reject that with "has unexpected children".
    BibliographyItem: mark({
        label: 'Bibliography Item',
        schema: {
            id: fields.text({ label: 'Reference Number' }),
        },
        tag: 'span',
    }),
    // Raw HTML elements used directly in MDX bodies still need declaring,
    // otherwise the editor treats them as unknown components.
    'lite-youtube': block({
        label: 'YouTube Embed (lite)',
        schema: {
            videoid: fields.text({ label: 'Video ID' }),
            playlabel: fields.text({ label: 'Play Label' }),
        }
    }),
    ol: wrapper({
        label: 'Ordered List (raw HTML)',
        schema: {
            className: fields.text({ label: 'CSS classes' }),
        }
    }),
    div: wrapper({
        label: 'Div (raw HTML)',
        schema: {
            style: fields.text({ label: 'Inline style' }),
            className: fields.text({ label: 'CSS classes' }),
        }
    }),
};

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
                        // Max 3 to protect the carousel layout. No min — an empty list is
                        // valid (nothing consumes this yet) and a min would make the
                        // singleton unopenable in the CMS until 3 posts were picked.
                        validation: { length: { max: 3 } }
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
                relatedFeature: fields.relationship({
                    label: 'Related Feature (Primary)',
                    description: 'Legacy single feature link. Used as a fallback when Related Features is empty.',
                    collection: 'features',
                    validation: { isRequired: true }
                }),
                relatedFeatures: fields.array(
                    fields.relationship({
                        label: 'Feature',
                        collection: 'features',
                    }),
                    {
                        label: 'Related Features',
                        description: 'Feature pages this post links to. Takes priority over the primary feature above.',
                        itemLabel: (props) => props.value || 'Select a feature',
                    }
                ),
                relatedBenefits: fields.multiselect({
                    label: 'Related Benefits',
                    description: 'Benefit pages surfaced in the post CTA block.',
                    options: [
                        { label: 'Increase Capacity', value: 'increase-capacity' },
                        { label: 'Digitize Operations', value: 'digitize-operations' },
                        { label: 'Delight Carriers', value: 'delight-carriers' },
                        { label: 'See Everything', value: 'see-everything' },
                    ],
                }),
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
                                components: mdxComponents,
                                options: { image: mdxImageOptions },
                            })
                        }),
                        video: fields.object({
                            youtubeId: fields.text({ label: 'YouTube Video ID' }),
                            duration: fields.text({ label: 'Video Duration (ISO 8601)' }),
                            content: fields.mdx({ 
                                label: 'Video Description',
                                components: mdxComponents,
                                options: { image: mdxImageOptions },
                            })
                        }),
                        short: fields.object({
                            youtubeId: fields.text({ label: 'YouTube Video ID' }),
                            duration: fields.text({ label: 'Video Duration (ISO 8601)' }),
                            content: fields.mdx({ 
                                label: 'Short Description',
                                components: mdxComponents,
                                options: { image: mdxImageOptions },
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
                                components: mdxComponents,
                                options: { image: mdxImageOptions },
                            })
                        }),
                        short: fields.object({
                            youtubeId: fields.text({ label: 'YouTube Video ID' }),
                            duration: fields.text({ label: 'Video Duration (ISO 8601)' }),
                            content: fields.mdx({ 
                                label: 'Short Description',
                                components: mdxComponents,
                                options: { image: mdxImageOptions },
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
                    components: mdxComponents,
                    options: { image: mdxImageOptions },
                }),
            },
        }),
        features: collection({
            label: 'Features',
            slugField: 'title',
            path: 'src/content/features/*',
            format: { contentField: 'content' },
            schema: {
                title: fields.slug({ name: { label: 'Title' } }),
                description: fields.text({ label: 'Short Description', multiline: true }),
                pubDate: fields.text({ label: 'Publish Date' }),
                icon: fields.text({ label: 'Icon path/URL' }),
                videoUrl: fields.text({ label: 'Video URL' }),
                faq: fields.array(
                    fields.object({
                        question: fields.text({ label: 'Question' }),
                        answer: fields.text({ label: 'Answer', multiline: true }),
                    }),
                    {
                        label: 'FAQ Items',
                        itemLabel: (props) => props.fields.question.value || 'New FAQ Item',
                    }
                ),
                keyMetric: fields.object(
                    {
                        value: fields.text({ label: 'Value' }),
                        label: fields.text({ label: 'Label' }),
                    },
                    { label: 'Key Metric' }
                ),
                testimonial: fields.object(
                    {
                        quote: fields.text({ label: 'Quote', multiline: true }),
                        author: fields.text({ label: 'Author' }),
                        role: fields.text({ label: 'Role' }),
                        company: fields.text({ label: 'Company' }),
                    },
                    { label: 'Testimonial' }
                ),
                bentoContent: fields.object(
                    {
                        implementation: fields.text({ label: 'Implementation', multiline: true }),
                        differentiation: fields.text({ label: 'Differentiation', multiline: true }),
                        businessImpact: fields.text({ label: 'Business Impact', multiline: true }),
                        vision: fields.text({ label: 'Vision', multiline: true }),
                        tableContext: fields.text({ label: 'Table Context', multiline: true }),
                        visionSegue: fields.text({ label: 'Vision Segue', multiline: true }),
                        dataViz: fields.object(
                            {
                                type: fields.select({
                                    label: 'Type',
                                    options: [
                                        { label: 'Mermaid', value: 'mermaid' },
                                        { label: 'Image', value: 'image' },
                                    ],
                                    defaultValue: 'mermaid',
                                }),
                                content: fields.text({ label: 'Content', multiline: true }),
                                caption: fields.text({ label: 'Caption' }),
                            },
                            { label: 'Data Visualisation' }
                        ),
                        table: fields.object(
                            {
                                title: fields.text({ label: 'Title' }),
                                headers: fields.array(fields.text({ label: 'Header' }), {
                                    label: 'Headers',
                                    itemLabel: (props) => props.value || 'Header',
                                }),
                                rows: fields.array(
                                    fields.array(fields.text({ label: 'Cell' }), {
                                        label: 'Cells',
                                        itemLabel: (props) => props.value || 'Cell',
                                    }),
                                    { label: 'Rows' }
                                ),
                            },
                            { label: 'Comparison Table' }
                        ),
                        layoutConfig: fields.object(
                            {
                                dataVizColSpan: fields.number({ label: 'Data Viz Col Span' }),
                                implementationColSpan: fields.number({ label: 'Implementation Col Span' }),
                                differentiationColSpan: fields.number({ label: 'Differentiation Col Span' }),
                                businessImpactColSpan: fields.number({ label: 'Business Impact Col Span' }),
                                dataVizRowSpan: fields.number({ label: 'Data Viz Row Span' }),
                                implementationRowSpan: fields.number({ label: 'Implementation Row Span' }),
                                differentiationRowSpan: fields.number({ label: 'Differentiation Row Span' }),
                                businessImpactRowSpan: fields.number({ label: 'Business Impact Row Span' }),
                                dataVizOrder: fields.number({ label: 'Data Viz Order' }),
                                implementationOrder: fields.number({ label: 'Implementation Order' }),
                                differentiationOrder: fields.number({ label: 'Differentiation Order' }),
                                businessImpactOrder: fields.number({ label: 'Business Impact Order' }),
                                dataVizPadding: fields.text({ label: 'Data Viz Padding (Tailwind class)' }),
                            },
                            { label: 'Bento Layout Config' }
                        ),
                    },
                    { label: 'Bento Content' }
                ),
                microApp: fields.text({ label: 'Micro App ID' }),
                content: fields.mdx({
                    label: 'Feature Content',
                    components: mdxComponents,
                    options: { image: mdxImageOptions },
                })
            }
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