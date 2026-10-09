"use client";

import { useEffect, useState } from "react";
import settings from "@/store-settings.json";

type Account = { id: string; username: string };

export default function DiscordConnect({ disabled, saveDraft, onBusyChange }: { disabled: boolean; saveDraft: () => void; onBusyChange: (busy: boolean) => void }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const result = new URLSearchParams(window.location.search).get("discord");
    if (result === "cancelled") setError("Discord connection was cancelled. Connect again when you're ready.");
    if (result === "expired") setError("That Discord login expired. Please connect again.");
    if (result === "failed") setError("Discord could not be connected. Please try again.");
    if (result) {
      const url = new URL(window.location.href);
      url.searchParams.delete("discord");
      window.history.replaceState(null, "", `${url.pathname}${url.search}`);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    const refresh = async () => {
      if (document.hidden || pending) return;
      pending = true;
      try {
        const response = await fetch("/api/discord", { cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]) });
        if (!response.ok) throw new Error("Unable to check your Discord connection.");
        const data = await response.json();
        if (!controller.signal.aborted) { setAccount(data.account); setConfigured(data.configured === true); }
      } catch {
        if (!controller.signal.aborted) setError("Unable to check your Discord connection. Please try again.");
      } finally { pending = false; if (!controller.signal.aborted) setLoading(false); }
    };
    void refresh();
    const restore = () => { setBusy(false); onBusyChange(false); void refresh(); };
    window.addEventListener("pageshow", restore);
    document.addEventListener("visibilitychange", refresh);
    return () => { controller.abort(); window.removeEventListener("pageshow", restore); document.removeEventListener("visibilitychange", refresh); };
  }, [attempt, onBusyChange]);

  const connect = async () => {
    setBusy(true); onBusyChange(true); setError("");
    try {
      saveDraft();
      const response = await fetch("/api/discord", { method: "POST", signal: AbortSignal.timeout(10000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Discord login is unavailable.");
      const url = new URL(data.url);
      if (url.origin !== "https://discord.com" || url.pathname !== "/oauth2/authorize" || url.username || url.password) throw new Error("Discord login address was invalid.");
      window.location.assign(url.href);
    } catch (error) { setError(error instanceof Error ? error.message : "Discord login is unavailable."); setBusy(false); onBusyChange(false); }
  };

  const disconnect = async () => {
    setBusy(true); onBusyChange(true); setError("");
    try {
      const response = await fetch("/api/discord", { method: "DELETE", signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error("Discord could not be disconnected. Please try again.");
      setAccount(null);
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to disconnect Discord."); }
    finally { setBusy(false); onBusyChange(false); }
  };

  return <section aria-labelledby="discord-heading" className="border-y-2 border-line py-4 space-y-3">
    <h3 id="discord-heading" className="font-bold">Discord rank</h3>
    <p className="text-xs">Connect the Discord account that should receive your role after a successful purchase. <a href={settings.discordLink} target="_blank" rel="noopener noreferrer" className="underline">Join our Discord server</a> first.</p>
    {loading ? <p role="status" className="text-sm">Checking Discord connection…</p> : account ? <>
      <p role="status" className="text-sm break-words">Connected as <strong>@{account.username}</strong></p>
      <button type="button" disabled={disabled || busy} onClick={() => void disconnect()} className="underline text-sm py-2">{busy ? "Disconnecting…" : "Disconnect Discord"}</button>
    </> : configured ? <button type="button" disabled={disabled || busy} onClick={() => void connect()} className="action-button w-full">{busy ? "Opening Discord…" : "Connect Discord"}</button> :
      <p className="text-sm">Discord login is currently unavailable. <a href={settings.tebexMainStore} className="underline">Use the official store</a> to purchase a Discord rank.</p>}
    {error && <div role="alert" className="text-sm text-error space-y-2"><p>{error}</p><button type="button" disabled={disabled || busy} onClick={() => { setError(""); setLoading(true); setAttempt(value => value + 1); }} className="underline py-2">Check connection again</button></div>}
  </section>;
}
