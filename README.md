This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Important Note ⚠️

This project uses the **Facebook Graph API** which can **only fetch data from your own Instagram Business Account**. Unlike web scraping methods, you cannot fetch data from other users' profiles (like @virat.kohli). This is a limitation of the official API.

## Getting Started

### 1. Setup Environment Variables
 Add your credentials in  `.env.local`:

```
FACEBOOK_PAGE_ACCESS_TOKEN=your_page_access_token_here
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_business_account_id_here
```

**How to get your credentials:**

1. **Page Access Token:**
   - Go to [Facebook Developers](https://developers.facebook.com/apps)
   - Create or select your app
   - Add "Instagram Graph API" product
   - Generate a Page Access Token with `instagram_basic` and `pages_read_engagement` permissions

2. **Instagram Business Account ID:**
   - Use [Graph API Explorer](https://developers.facebook.com/tools/explorer)
   - Make a request to: `/me/accounts?fields=instagram_business_account`
   - Copy the `instagram_business_account.id` value

### 2. Run the Development Server

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
