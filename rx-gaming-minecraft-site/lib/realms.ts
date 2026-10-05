export const realms = [
  { id: "insanecraft", name: "Insanecraft", mode: "anarchy", host: "mc.biccys.uk", port: 25567, version: "1.12.2" },
  { id: "rlcraft", name: "RLCraft", mode: "survival", host: "play.rx-gaming.online", port: 25565, version: "1.12.2" },
] as const;
export function getRealm(slug: string) {
  const normalized = slug.toLowerCase();
  return realms.find(realm => realm.id === normalized || realm.mode === normalized || (normalized === "anarchia" && realm.mode === "anarchy"));
}

