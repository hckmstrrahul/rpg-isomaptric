/** Independent of the world's random stream, so changing lights never moves scenery. */
export function lightingRandom(seed: number) {
  let n = Math.imul(seed ^ 0x9e3779b9, 0x21f0aaad);
  n = Math.imul(n ^ (n >>> 15), 0x735a2d97);
  return ((n ^ (n >>> 15)) >>> 0) / 4294967296;
}

const roomColors = [
  [255, 188, 94], [255, 211, 146], [246, 219, 174],
  [166, 202, 235], [221, 215, 174], [151, 204, 195],
];

export function windowLighting(seed: number, cols: number, rows: number,profile:'home'|'office'='home') {
  if(profile==='office') {
    // Neighboring bays belong to an office suite. Floor-wide brightness and color
    // changes read as occupied interiors instead of an independent checkerboard.
    return Array.from({length:cols*rows},(_,cell)=>{
      const row=Math.floor(cell/cols),col=cell%cols,floorKey=seed*173+row*113;
      const suiteKey=seed*4099+Math.floor(row/2)*137+Math.floor((col+seed%3)/3)*67;
      if(lightingRandom(floorKey+9)<.18||lightingRandom(suiteKey+1)>(seed%8===3?.28:.63))return null;
      const cool=lightingRandom(suiteKey+2)>.82;
      const color=cool?[189,219,241]:[[255,211,154],[255,229,191],[245,219,175]][Math.floor(lightingRandom(floorKey+3)*3)];
      const brightness=.48+lightingRandom(floorKey+4)*.16+lightingRandom(suiteKey+5)*.12;
      return color.map(channel=>Math.round(channel*brightness)) as [number,number,number];
    });
  }
  // A few almost-empty buildings, with mixed occupancy elsewhere.
  const occupancy = seed % 8 === 3 ? .12 : .35 + lightingRandom(seed) * .2;
  return Array.from({ length: cols * rows }, (_, cell) => {
    const key = seed * 4099 + cell * 31;
    if (lightingRandom(key + 1) > occupancy) return null;
    const choice = lightingRandom(key + 2);
    const palette = choice < .7 ? Math.floor(choice / .7 * 3) : 3 + Math.floor((choice - .7) / .3 * 3);
    const brightness = .58 + lightingRandom(key + 3) * .34;
    return roomColors[Math.min(5, palette)].map(channel => Math.round(channel * brightness)) as [number, number, number];
  });
}
