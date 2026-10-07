RX-Gaming InsaneCraft donor kits

Files
- Essentials-kits-section.yml: the replacement kits: block. This is the safest file to apply.
- Essentials-config-reference.yml: the full Essentials config based on the previously supplied server bundle. Only use it if your live config has not been edited since that bundle was prepared.

Install the kit changes
1. Stop the Minecraft server.
2. Download a backup of plugins/Essentials/config.yml.
3. Open your current config.yml and replace its entire kits: section (from kits: up to the next top-level section) with the contents of Essentials-kits-section.yml.
4. Save the file and start the server. Essentials will reload the kit definitions at startup.
5. In game, claim a kit with /kit extreme, /kit mental, /kit loony, /kit nutty, /kit crazy, or /kit insane.

The starter and food kit definitions are retained. The old vip, mvp, elite, and legend kit definitions are removed. Each donor kit has its own cooldown, and higher donor ranks need the corresponding essentials.kits.<rank> permission already assigned by LuckPerms.

Cooldowns: Extreme 24 hours; Mental 48 hours; Loony 3 days; Nutty 4 days; Crazy 5 days; Insane 7 days.