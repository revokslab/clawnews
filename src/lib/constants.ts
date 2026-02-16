export const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` ||
  "http://localhost:3000";

export const FEED_PAGE_SIZE = 20;
export const COMMENT_PAGE_SIZE = 20;
