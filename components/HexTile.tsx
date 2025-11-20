
import React from 'react';
import { HexCoord, TerrainType } from '../types';
import { hexToPixel } from '../services/hexLogic';
import { HEX_SIZE, TERRAIN_CONFIG } from '../constants';
import { Trees, TreePine, Mountain, Waves, Footprints, Castle, Home, Building2 } from 'lucide-react';

interface HexTileProps {
  hex: HexCoord;
  terrain: TerrainType;
  hasRoad?: boolean;
  roadNeighbors?: boolean[]; // Array of 6 booleans for neighbors [0..5]
  isHovered: boolean;
  isPath: boolean;
  isTarget: boolean;
  isStart: boolean;
  onClick: (hex: HexCoord) => void;
  onMouseEnter: (hex: HexCoord) => void;
}

const HexTile: React.FC<HexTileProps> = React.memo(({ 
  hex, 
  terrain, 
  hasRoad,
  roadNeighbors,
  isHovered, 
  isPath, 
  isTarget, 
  isStart, 
  onClick, 
  onMouseEnter 
}) => {
  const { x, y } = hexToPixel(hex, HEX_SIZE);
  const config = TERRAIN_CONFIG[terrain];

  // Calculate points for a pointy-topped hexagon
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle_deg = 60 * i - 30;
    const angle_rad = (Math.PI / 180) * angle_deg;
    points.push(`${x + HEX_SIZE * Math.cos(angle_rad)},${y + HEX_SIZE * Math.sin(angle_rad)}`);
  }
  const pointsString = points.join(' ');

  // Determine visual styles
  const fill = config.color;
  let stroke = config.stroke;
  let strokeWidth = 2;
  
  if (isTarget) {
    stroke = '#ef4444'; // Red Target Border
    strokeWidth = 4;
  }

  if (isHovered) {
    stroke = '#ffffff';
    strokeWidth = 3;
  }

  const Icon = () => {
    const iconProps = { size: HEX_SIZE * 0.8, className: "opacity-40 text-black pointer-events-none" };
    switch(terrain) {
      case TerrainType.FOREST: return <Trees {...iconProps} color="#052e16" />;
      case TerrainType.DENSE_FOREST: return <TreePine {...iconProps} color="#022c22" />;
      case TerrainType.MOUNTAIN: return <Mountain {...iconProps} color="#292524" />;
      case TerrainType.WATER: return <Waves {...iconProps} color="#172554" />;
      case TerrainType.WALL: return <Castle {...iconProps} color="#0f172a" />;
      case TerrainType.SAND: return <Footprints {...iconProps} size={HEX_SIZE * 0.6} color="#713f12" />;
      case TerrainType.SMALL_BUILDING: return <Home {...iconProps} size={HEX_SIZE * 0.6} color="#1e293b" />;
      case TerrainType.BIG_BUILDING: return <Building2 {...iconProps} color="#0f172a" />;
      default: return null;
    }
  }

  // Road Rendering
  const renderRoads = () => {
    if (!hasRoad) return null;

    // Inner radius (distance to center of edge)
    const innerRadius = HEX_SIZE * (Math.sqrt(3) / 2);
    
    // Angles for the 6 neighbors (0 is East, 60 is SE, etc.)
    // Based on pointy top hex neighbor directions in HexLogic:
    // 0: East (0 deg), 1: NE (-60 deg), 2: NW (-120 deg), 3: West (180 deg), 4: SW (120 deg), 5: SE (60 deg)
    const neighborAngles = [0, -60, -120, 180, 120, 60];

    return (
      <g className="pointer-events-none">
        {/* Road Hub */}
        <circle cx={x} cy={y} r={HEX_SIZE * 0.25} fill="#57534e" />
        
        {/* Road Arms */}
        {roadNeighbors?.map((hasNeighborRoad, index) => {
           if (!hasNeighborRoad) return null;
           
           const angle = neighborAngles[index] * (Math.PI / 180);
           // Draw line from center to edge midpoint
           const x2 = x + innerRadius * Math.cos(angle);
           const y2 = y + innerRadius * Math.sin(angle);

           return (
             <line 
               key={index} 
               x1={x} y1={y} 
               x2={x2} y2={y2} 
               stroke="#57534e" 
               strokeWidth={HEX_SIZE * 0.3} 
               strokeLinecap="round"
             />
           );
        })}
      </g>
    );
  };

  return (
    <g 
      onClick={() => onClick(hex)}
      onMouseEnter={() => onMouseEnter(hex)}
      className="cursor-pointer transition-all duration-200"
      style={{ transition: 'fill 0.2s' }}
    >
      <polygon 
        points={pointsString} 
        fill={fill} 
        stroke={stroke} 
        strokeWidth={strokeWidth}
      />
      
      {renderRoads()}

      {/* Icon Overlay */}
      <foreignObject 
        x={x - HEX_SIZE/2} 
        y={y - HEX_SIZE/2} 
        width={HEX_SIZE} 
        height={HEX_SIZE} 
        className="pointer-events-none"
      >
        <div className="flex items-center justify-center h-full w-full relative">
            {/* Terrain Icon - faded if path is active to show footsteps clearly */}
           <div className={`transition-opacity duration-200 ${isPath ? 'opacity-20' : 'opacity-100'}`}> 
             <Icon />
           </div>

           {/* Path Footsteps Overlay */}
           {isPath && (
              <div className="absolute inset-0 flex items-center justify-center">
                  <Footprints 
                    size={HEX_SIZE * 0.7} 
                    color="#111827" 
                    fill="#111827"
                    className="opacity-90 drop-shadow-sm"
                  />
              </div>
           )}
        </div>
      </foreignObject>

      {/* Coordinate Debug (Optional) */}
      {isHovered && (
         <text x={x} y={y + HEX_SIZE/1.5} textAnchor="middle" fontSize="8" fill="black" className="pointer-events-none font-bold opacity-70">
            {`${hex.q},${hex.r}`}
         </text>
      )}

      {/* Player Token */}
      {isStart && (
        <circle cx={x} cy={y} r={HEX_SIZE * 0.4} fill="#3b82f6" stroke="white" strokeWidth={2} className="animate-pulse pointer-events-none" />
      )}
    </g>
  );
});

export default HexTile;
