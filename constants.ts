
import { TerrainType } from './types';

export const HEX_SIZE = 35; // Radius of a hex in pixels
export const MAP_RADIUS = 6; // Radius of the map in hexes (0 to 6)
export const ROAD_COST = 0.75;

export const TERRAIN_CONFIG: Record<TerrainType, { color: string; stroke: string; cost: number; label: string }> = {
  [TerrainType.PLAINS]: { 
    color: '#4ade80', // green-400
    stroke: '#22c55e', 
    cost: 1,
    label: 'Plains (1)'
  },
  [TerrainType.FOREST]: { 
    color: '#15803d', // green-700
    stroke: '#166534', 
    cost: 2,
    label: 'Light Forest (2)'
  },
  [TerrainType.DENSE_FOREST]: { 
    color: '#064e3b', // emerald-900
    stroke: '#022c22', 
    cost: 3,
    label: 'Dense Forest (3)'
  },
  [TerrainType.SAND]: { 
    color: '#fde047', // yellow-300
    stroke: '#eab308', 
    cost: 1.5,
    label: 'Sand (1.5)'
  },
  [TerrainType.MOUNTAIN]: { 
    color: '#57534e', // stone-600
    stroke: '#44403c', 
    cost: 4,
    label: 'Mountain (4)'
  },
  [TerrainType.WATER]: { 
    color: '#3b82f6', // blue-500
    stroke: '#2563eb', 
    cost: Infinity,
    label: 'Water (Block)'
  },
  [TerrainType.WALL]: { 
    color: '#1e293b', // slate-800
    stroke: '#0f172a', 
    cost: Infinity,
    label: 'Wall (Block)'
  },
  [TerrainType.SMALL_BUILDING]: { 
    color: '#94a3b8', // slate-400
    stroke: '#64748b', 
    cost: 1,
    label: 'Small Building (1)'
  },
  [TerrainType.BIG_BUILDING]: { 
    color: '#475569', // slate-600
    stroke: '#334155', 
    cost: 1,
    label: 'Big Building (1)'
  },
};
