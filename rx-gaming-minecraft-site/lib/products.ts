import productsData from "./products.json";

export type ProductCategory = "packages" | "ranks" | "other";
export type ProductMode = "anarchy" | "survival" | "skywars" | "practice" | "all";

export type ProductContent = {
    label: string;
    qty: string;
};

export type Product = {
    id: string;
    name: string;
    price: number;
    currency?: string;
    disableQuantity?: boolean;
    recurring?: boolean;
    description?: string;
    originalPrice?: number;
    isPromo: boolean;
    color: string;
    shadowColor?: string;
    img: string;
    category: ProductCategory;
    mode: ProductMode | ProductMode[];
    contents?: ProductContent[];
    isUpsell?: boolean;
    isReward?: boolean;
};

export const REWARD_THRESHOLD = productsData.rewardThreshold;
export const rewardProduct = productsData.rewardProduct as Product;
export const products = productsData.products as Product[];

export const marqueeText = productsData.marqueeText || "https://discord.gg/DgPSGVZDUr";

export const mappings = productsData.mappings as {
    modes: { mode: ProductMode; keywords: string[] }[];
    categories: { category: ProductCategory; keywords: string[] }[];
};

export function getProductsByMode(mode: string): Product[] {
    const targetMode = mode === "anarchia" ? "anarchy" : mode;
    return products.filter((p) => {
        if (p.isUpsell || p.isReward) return false;
        if (Array.isArray(p.mode)) return p.mode.includes(targetMode as ProductMode);
        return p.mode === targetMode || p.mode === "all";
    });
}

export function getUpsellsByMode(mode: string): Product[] {
    const targetMode = mode === "anarchia" ? "anarchy" : mode;
    return products.filter((p) => {
        if (!p.isUpsell) return false;
        if (Array.isArray(p.mode)) return p.mode.includes(targetMode as ProductMode);
        return p.mode === targetMode || p.mode === "all";
    });
}
