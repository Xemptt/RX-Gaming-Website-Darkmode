"use client";
import { useEffect, useState } from "react";
export default function ServerCounter({ serverId, serverName }: { serverId: string; serverName: string }) {
  const [status, setStatus] = useState<{ online: boolean | null; playersOnline?: number; maxPlayers?: number } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const refresh = async () => {
      try {
        const response = await fetch(`/api/server-status?server=${encodeURIComponent(serverId)}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Status unavailable");
        const data = await response.json();
        if (!controller.signal.aborted) setStatus(data);
      } catch { if (!controller.signal.aborted) setStatus({ online: null }); }
    };
    void refresh();
    const timer = setInterval(refresh, 60000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [serverId]);
  const label = !status ? "Checking…" : status.online === true ? `${status.playersOnline}/${status.maxPlayers} players` : status.online === false ? "Offline" : "Status unavailable";
  return <span role="status" aria-label={`${serverName}: ${label}`} className="text-muted text-xs font-bold flex items-center gap-2">
    <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${status?.online ? "bg-green-600" : "bg-stone-400"}`} />{label}
  </span>;
}
