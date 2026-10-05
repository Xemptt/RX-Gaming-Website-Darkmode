import settings from "@/store-settings.json";
// Set SITE_URL to the website's public origin when deploying separately from the game server.
export const siteUrl = new URL(process.env.SITE_URL || settings.websiteUrl);
export const hostedStoreUrl = settings.tebexMainStore;

