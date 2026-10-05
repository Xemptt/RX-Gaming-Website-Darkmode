import settings from "@/store-settings.json";
export const documents = [
  { id: 1, title: "Terms of Service", content: settings.tosText, icon: "📄" },
  { id: 2, title: "Privacy Policy", content: settings.privacyText, icon: "🔒" },
  { id: 3, title: "Server Rules", content: settings.rulesText, icon: "🛡️" },
  { id: 4, title: "Discord Rules", content: settings.discordRulesText, icon: "💬" },
];
