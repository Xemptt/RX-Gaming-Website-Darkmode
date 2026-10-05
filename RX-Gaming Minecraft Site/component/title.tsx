"use client";

import { useEffect } from "react";
import storeSettings from "@/store-settings.json";

export default function Title() {
    useEffect(() => {
        // FIX: Connected the browser tab title text directly to your master control file parameter!
        const originalTitle = `${storeSettings.serverName.toUpperCase()} | Official Store`;
        const departureTitle = `Come back to ${storeSettings.serverName}! :(`;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                document.title = departureTitle;
            } else {
                document.title = originalTitle;
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    return null;
}
