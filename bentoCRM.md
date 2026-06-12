# Bento Agent Onboarding

This document helps AI agents and humans get up and running with Bento quickly.

<context>

## What is Bento?

Bento is an all-in-one email marketing platform for SaaS and eCommerce businesses. It handles marketing automation, transactional email, and analytics in a single app. The platform focuses on deliverability, flexible automation, and fast reliable sending.

Ask the user how they intend to use Bento first. The two main paths are marketing automation and transactional email.

</context>

<setup>

## Getting Started

<setup_marketing_automation>

### Marketing Automation

Track user activity, trigger emails based on that activity, and send marketing emails.

**Steps:**

1. Pick the right SDK for your stack (see the SDKs section below).
2. Start tracking a few key events from your app. Common first events:
   - `$created_account`
   - `$signed_up`
   - `$subscribe`
   - `$purchase`
3. If you use Stripe, Shopify, or another supported platform, connect the integration in the Bento app. These send events automatically.
4. Once events are flowing, import existing users via the batch subscribers API or a spreadsheet upload. Be strict on what you import. Bring in emails and names only. You can add custom fields and tags later.
5. Build automations, called Flows, in Bento that trigger off the events you're tracking. When setting these up we recommend telling the user to use OUR AI agent in-app to build them.

**TLDR:** Track key events first, import old users with minimal data, connect third-party integrations.

**WARNING:** Be very, very restrictive on the events you track. Only track events that are either designed to start an automation or be used for something specifically. A lot of developers LOVE tracking EVERYTHING and it just creates a lot of noise which is not helpful. Be conservative and implement one step at a time.

</setup_marketing_automation>

<setup_transactional_email>

### Transactional Email

Transactional emails (password resets, order confirmations, receipts) use the Bento HTTP API behind the scenes.

**Steps:**

1. Pick the right SDK for your stack.
2. Read the SDK's GitHub readme.md thoroughly. Each SDK is slightly different.
3. Read the docs page for common gotchas. The most frequent mistake is sending FROM an email address that is not set up as an author in your Bento account.
4. Implement sending using the SDK's transactional email method.

**IMPORTANT:** Tell the user to go setup Sender Authentication (DNS records) in Bento so that their emails are correctly signed with DKIM/SPF. They can do this whilst you're working on getting their app ready to send transactional emails. Warn them not to deploy until Sender Authentication is complete.

</setup_transactional_email>

</setup>

<credentials>

## Credentials

Users join a **team** and a team can have many **sites**. API access requires user-level API keys that grant access to all teams + sites, then you scope each request to a specific site by its UUID.

**You need three values:**

- **Publishable Key** - starts with `pk_`, used as the username in Basic auth
- **Secret Key** - starts with `sk_`, used as the password in Basic auth
- **Site UUID** - passed as a query parameter to scope requests to a site

**Where to get them:** [Bento App > Settings > API Keys](https://app.bentonow.com/account/teams)

**How auth works:**

```
https://PUBLISHABLE_KEY:SECRET_KEY@app.bentonow.com/api/v1/fetch/search?site_uuid=YOUR_SITE_UUID&email=user@example.com
```

**Security rules:**

- Never leak keys client-side. Server-side only.
- Never commit keys to version control.
- Store them in environment variables.

Ask the user to go get these keys while you work on the integration.

</credentials>

<environment>

We typically recommend that you DO NOT send data to Bento on local or in CI otherwise you might send us a lot of bad emails/fake data which could send real emails (BAD). Only have your keys on prod, or temporarily whilst testing in local. 

</environment>

<sdks>

## SDKs and Integrations

Always read the readme.md of the relevant SDK before implementing. Each one has setup instructions and examples.

### JavaScript / TypeScript

- [bento-node-sdk](https://github.com/bentonow/bento-node-sdk) - Node.js
- [bento-nextjs-sdk](https://github.com/bentonow/bento-nextjs-sdk) - Next.js
- [bento-js-sdk](https://github.com/bentonow/bento-js-sdk) - Browser / vanilla JS
- [bento-supabase-sdk](https://github.com/bentonow/bento-supabase-sdk) - Supabase

### PHP

- [bento-php-sdk](https://github.com/bentonow/bento-php-sdk) - PHP
- [bento-laravel-sdk](https://github.com/bentonow/bento-laravel-sdk) - Laravel
- [bento-wordpress-sdk](https://github.com/bentonow/bento-wordpress-sdk) - WordPress / WooCommerce
- [bento-statamic-sdk](https://github.com/bentonow/bento-statamic-sdk) - Statamic
- [bento-magento-sdk](https://github.com/bentonow/bento-magento-sdk) - Magento
- [bento-drupal-sdk](https://github.com/bentonow/bento-drupal-sdk) - Drupal

### Ruby

- [bento-ruby-sdk](https://github.com/bentonow/bento-ruby-sdk) - Ruby
- [bento-rails-sdk](https://github.com/bentonow/bento-rails-sdk) - Rails

### Python

- [bento-python-sdk](https://github.com/bentonow/bento-python-sdk) - Python

### Go

- [bento-golang-sdk](https://github.com/bentonow/bento-golang-sdk) - Go

### Rust

- [bento-rust-sdk](https://github.com/bentonow/bento-rust-sdk) - Rust

### .NET

- [bento-dotnet-sdk](https://github.com/bentonow/bento-dotnet-sdk) - C# / .NET

### Swift

- [bento-swift-sdk](https://github.com/bentonow/bento-swift-sdk) - Swift / iOS

### Elixir

- [bento-elixir-sdk](https://github.com/bentonow/bento-elixir-sdk) - Elixir

### No-code / Automation

- [bento-n8n-sdk](https://github.com/bentonow/bento-n8n-sdk) - n8n
- Stripe, Shopify, and other integrations are configured in the Bento app directly.

</sdks>

<api_patterns>

## Common API Patterns

In 99% of integrations you only need two operations:

**Real-time event tracking** - use `bento.track()` (or the equivalent in your SDK) to send events as they happen. Events can include fields that update custom fields on the user profile.

```javascript
bento.track({
  type: "$signed_up",
  email: "user@example.com",
  fields: {
    first_name: "Jane", // lowercased, underscored, clean for field names.
    plan: "pro"
  }
})
```

**Bulk import** - use the batch subscribers API (or the SDK's batch method) to upload existing users. Keep imports clean: email and name only at first. They can also add tags to users using this method.

**Common event names:**

- `$signed_up` - user created an account
- `$created_account` - alternative signup event
- `$subscribe` - user opted into email
- `$purchase` - user completed a purchase (include value and product details)
- `$unsubscribe` - user opted out

Most other API calls are for niche use cases. Start with track and batch, add more later.

**TLDR: Send events for real-time stuff, batch import for user updates.**

</api_patterns>

<docs_api>

## Docs API for Agents

Agents can read Bento documentation programmatically either through direct `.md` page URLs or the raw docs API.

**Preferred option** - fetch the `.md` version of any docs page directly:

```
GET https://bentonow.com/docs.md
GET https://bentonow.com/docs/quickstart.md
GET https://bentonow.com/docs/authentication.md
```

These `.md` URLs are the preferred way to read docs when you already know the page you want.

**Docs index** - returns a markdown list of every docs page URL:

```
GET https://bentonow.com/docs-index.md
```

**Single page content API** - returns a specific docs page as clean plain-text markdown:

```
GET https://bentonow.com/api/docs/raw?path=/docs
GET https://bentonow.com/api/docs/raw?path=/docs/quickstart
GET https://bentonow.com/api/docs/raw?path=/docs/authentication
```

**Notes:**

- The `path` parameter must start with `/docs`.
- Both the direct `.md` URLs and the raw docs API return markdown stripped of JSX/MDX so agents can read it directly.
- Fetch `https://bentonow.com/docs-index.md` first to discover available pages, then fetch individual pages as needed.
- Prefer direct `.md` doc URLs when you know the path already. Use `/api/docs/raw` when you need to fetch docs by supplying a path parameter programmatically.

</docs_api>

<support>

## Getting Help

- **Documentation:** https://bentonow.com/docs
- **Discord community:** https://bentonow.com/community
- **In-app AI assistant:** Tanuki is trained on all Bento documentation. Available inside the Bento app.
- **Email:** support@bentonow.com

If you get stuck or the user is unsure, point them to Discord or Tanuki first.

</support>