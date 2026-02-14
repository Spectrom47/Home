export function renderLore(): string {
  return `
    <div class="card">
      <h1>Game & Lore Archive</h1>
    </div>

    <div class="card">
      <h2>Play the Game</h2>
      <a href="https://www.roblox.com/games/yourgame" target="_blank">Launch Game</a>
    </div>

    <div class="card">
      <h2>Lore Sections</h2>
      <ul>
        <li>Enemies</li>
        <li>Weapons</li>
        <li>Factions</li>
        <li>World History</li>
      </ul>
      <p>This section will expand into a wiki-style archive over time.</p>
    </div>

    <div class="card">
      <a href="#/">← Return Home</a>
    </div>
  `;
}
