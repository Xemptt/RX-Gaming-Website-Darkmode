import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import CartHydration from "@/component/cart-hydration";
import AppearanceProvider from "@/component/appearance-provider";
import { siteUrl } from "@/lib/site";
import storeSettings from "../store-settings.json";
import { Analytics } from "@vercel/analytics/react";

const minecraftFont = localFont({
    src: "./fonts/Minecraft.ttf",
    weight: "400",
    variable: "--font-minecraft"
});

export const metadata: Metadata = {
    metadataBase: siteUrl,
    title: {
        default: `${storeSettings.serverName.toUpperCase()} | Official Store`,
        template: `%s | ${storeSettings.serverName}`,
    },
    description: `Welcome to the official ${storeSettings.serverName} Network rank and item shop. Join our amazing community realms today!`,
    keywords: ["minecraft", "minecraft server", "store", "ranks", "addons", "community"],
    authors: [{ name: storeSettings.serverName }],
    creator: storeSettings.serverName,
    openGraph: {
        type: "website",
        locale: "en_US",
        url: siteUrl.href,
        siteName: storeSettings.serverName,
        title: `${storeSettings.serverName} | Official Store`,
        description: `Welcome to the official ${storeSettings.serverName} Network rank and item shop. Join our amazing community realms today!`,
        images: [
            {
                url: "/header.png",
                width: 1200,
                height: 630,
                alt: storeSettings.serverName,
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: `${storeSettings.serverName} | Minecraft Store`,
        description: `Welcome to the official ${storeSettings.serverName} Network rank and item shop. Join our amazing community realms today!`,
        images: ["/header.png"],
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${minecraftFont.className} ${minecraftFont.variable} antialiased bg-page text-foreground flex flex-col min-h-screen`}>
                <AppearanceProvider>
                    <a href="#main-content" className="skip-link">Skip to content</a>
                    <CartHydration />
                    {children}
                    <Analytics />
                </AppearanceProvider>
            </body>
        </html>
    );
}
