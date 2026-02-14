export function renderHome(): string {
  return `
    <div class="card">
      <h1>Welcome to Spectrom Galaxy</h1>
      <p>Your hub into the void.</p>
    </div>

    <div class="card">
      <h2>Join the Discord</h2>
      <a href="https://discord.gg/yourlink" target="_blank">Enter the Portal</a>
    </div>

    <div class="card">
      <h2>YouTube Channel</h2>
      <a href="https://youtube.com/yourchannel" target="_blank">Watch the Universe</a>
    </div>

    <div class="card">
      <h2>Roblox Community</h2>
      <a href="https://www.roblox.com/groups/yourgroup" target="_blank">Join the Faction</a>
    </div>

    <div class="card">
      <a href="#/lore">Enter Game & Lore →</a>
    </div>
  `;
}
