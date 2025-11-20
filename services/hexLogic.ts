
import { HexCoord, HexTileData, Point, TerrainType, PathNode } from '../types';
import { TERRAIN_CONFIG } from '../constants';

// --- Hex Geometry (Axial Storage, Cube Math) ---

export const createHex = (q: number, r: number): HexCoord => ({ q, r, s: -q - r });

export const hexToString = (hex: HexCoord): string => `${hex.q},${hex.r}`;

export const hexToPixel = (hex: HexCoord, size: number): Point => {
  const x = size * (Math.sqrt(3) * hex.q + (Math.sqrt(3) / 2) * hex.r);
  const y = size * ((3 / 2) * hex.r);
  return { x, y };
};

export const pixelToHex = (x: number, y: number, size: number): HexCoord => {
  const q = ((Math.sqrt(3) / 3) * x - (1 / 3) * y) / size;
  const r = ((2 / 3) * y) / size;
  return hexRound({ q, r, s: -q - r });
};

const hexRound = (hex: { q: number; r: number; s: number }): HexCoord => {
  let q = Math.round(hex.q);
  let r = Math.round(hex.r);
  let s = Math.round(hex.s);

  const q_diff = Math.abs(q - hex.q);
  const r_diff = Math.abs(r - hex.r);
  const s_diff = Math.abs(s - hex.s);

  if (q_diff > r_diff && q_diff > s_diff) {
    q = -r - s;
  } else if (r_diff > s_diff) {
    r = -q - s;
  } else {
    s = -q - r;
  }
  return { q, r, s };
};

export const hexDistance = (a: HexCoord, b: HexCoord): number => {
  return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.s - b.s)) / 2;
};

// Directions for neighbors (0 to 5)
// 0: East, 1: NE, 2: NW, 3: West, 4: SW, 5: SE
export const DIRECTIONS = [
  createHex(1, 0), createHex(1, -1), createHex(0, -1),
  createHex(-1, 0), createHex(-1, 1), createHex(0, 1)
];

export const getNeighbors = (hex: HexCoord): HexCoord[] => {
  return DIRECTIONS.map(d => createHex(hex.q + d.q, hex.r + d.r));
};

// --- Map Generation ---

export const generateMap = (radius: number): Map<string, HexTileData> => {
  const map = new Map<string, HexTileData>();
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
      const hex = createHex(q, r);
      map.set(hexToString(hex), {
        ...hex,
        terrain: TerrainType.PLAINS,
        cost: TERRAIN_CONFIG[TerrainType.PLAINS].cost,
        hasRoad: false
      });
    }
  }
  return map;
};

// --- Pathfinding (A*) ---

export const findPath = (
  start: HexCoord,
  end: HexCoord,
  map: Map<string, HexTileData>
): HexCoord[] => {
  const startKey = hexToString(start);
  const endKey = hexToString(end);

  if (!map.has(endKey) || map.get(endKey)!.cost === Infinity) {
    return []; // Target unreachable or invalid
  }

  const openSet: PathNode[] = [];
  const closedSet = new Set<string>();
  const nodeMap = new Map<string, PathNode>(); // Keep track of nodes to update

  const startNode: PathNode = {
    id: startKey,
    g: 0,
    h: hexDistance(start, end),
    f: hexDistance(start, end),
    parent: null
  };

  openSet.push(startNode);
  nodeMap.set(startKey, startNode);

  while (openSet.length > 0) {
    // Sort by F cost (lowest first) - Naive priority queue
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!; // Pop lowest

    if (current.id === endKey) {
      // Reconstruct path
      const path: HexCoord[] = [];
      let temp: PathNode | null = current;
      while (temp) {
        const [q, r] = temp.id.split(',').map(Number);
        path.push(createHex(q, r));
        temp = temp.parent;
      }
      return path.reverse(); // Start to End
    }

    closedSet.add(current.id);

    const [cq, cr] = current.id.split(',').map(Number);
    const neighbors = getNeighbors(createHex(cq, cr));

    for (const neighbor of neighbors) {
      const nKey = hexToString(neighbor);
      
      if (!map.has(nKey) || closedSet.has(nKey)) continue;

      const tileData = map.get(nKey)!;
      if (tileData.cost === Infinity) continue; // Wall/Water

      const tentativeG = current.g + tileData.cost;
      let neighborNode = nodeMap.get(nKey);

      if (!neighborNode) {
        neighborNode = {
          id: nKey,
          g: Infinity,
          h: hexDistance(neighbor, end),
          f: Infinity,
          parent: null
        };
        nodeMap.set(nKey, neighborNode);
        openSet.push(neighborNode);
      }

      if (tentativeG < neighborNode.g) {
        neighborNode.parent = current;
        neighborNode.g = tentativeG;
        neighborNode.f = tentativeG + neighborNode.h;
      }
    }
  }

  return []; // No path found
};
