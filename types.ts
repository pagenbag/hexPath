
export enum TerrainType {
  PLAINS = 'PLAINS',
  FOREST = 'FOREST', // Light Forest
  DENSE_FOREST = 'DENSE_FOREST', // Dense/Heavy Forest
  MOUNTAIN = 'MOUNTAIN',
  WATER = 'WATER',
  SAND = 'SAND',
  WALL = 'WALL', // Indestructible obstacle
  SMALL_BUILDING = 'SMALL_BUILDING',
  BIG_BUILDING = 'BIG_BUILDING'
}

export interface HexCoord {
  q: number;
  r: number;
  s: number; // q + r + s = 0
}

export interface HexTileData extends HexCoord {
  terrain: TerrainType;
  cost: number; // Movement cost (Infinity for blocking)
  hasRoad?: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface PathNode {
  id: string; // "q,r"
  g: number;
  h: number;
  f: number;
  parent: PathNode | null;
}

// For AI Generation response
export interface TerrainMapRequest {
  description: string;
  radius: number;
}

export interface GeneratedHex {
  q: number;
  r: number;
  terrain: TerrainType;
  hasRoad?: boolean;
}
