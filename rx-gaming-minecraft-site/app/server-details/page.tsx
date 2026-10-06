"use client";
import Navbar from "@/component/navbar";
import Footer from "@/component/footer";
import ServerCounter from "@/component/servercounter";
import { realms } from "@/lib/realms";
import { useState } from "react";
export default function ServerDetailsPage() {
  const [message, setMessage] = useState("");
  const copy = async (address: string) => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(address);
      setMessage(`Copied ${address}.`);
    } catch { setMessage(`Couldn't copy automatically. Select and copy this address: ${address}`); }
  };
  return <div className="min-h-screen flex flex-col bg-page text-foreground"><Navbar />
    <main id="main-content" className="max-w-7xl mx-auto w-full px-4 py-8 space-y-8 flex-1">
      <div className="space-y-3">
        <h1 className="text-3xl md:text-5xl font-black uppercase">Server details</h1>
        <p className="max-w-3xl text-muted">Choose a realm to view its modpack information, server address and store packages.</p>
      </div>
      <p className="text-xs text-muted">Server status may be cached for up to five minutes.</p>
      <p role="status" className="font-bold min-h-6">{message}</p>
      <div className="grid lg:grid-cols-2 gap-6">{realms.map(realm => <section key={realm.id} className="panel space-y-6">
        <div className="flex flex-wrap justify-between gap-4"><h2 className="text-2xl font-bold">{realm.name}</h2><span className="bg-black text-white px-3 py-1">Java {realm.version}</span></div>
        <ServerCounter serverId={realm.id} serverName={realm.name} />
        <p className="font-bold select-all break-all">{realm.host}:{realm.port}</p>
        <button className="action-button" onClick={() => void copy(`${realm.host}:${realm.port}`)}>Copy {realm.name} IP</button>
        <a className="action-button block" href={`/${realm.id}`}>Explore {realm.name} profile →</a>
      </section>)}</div>
    </main><Footer /></div>;
}
