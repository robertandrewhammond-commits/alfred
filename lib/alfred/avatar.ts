// Deterministic initials + color for an Area, so the same name always
// renders the same way (no random reshuffling on every page load).

const PALETTE = [
  "#b5566a", // rose
  "#c99a3f", // amber
  "#6f9b6f", // sage
  "#8a5a3b", // umber
  "#5b84a8", // steel blue
  "#4a3b34", // espresso
  "#7a3b4e", // wine
];

export function areaInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function areaColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
