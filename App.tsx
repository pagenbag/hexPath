
import React, { useState, useEffect, useMemo } from 'react';
import { createHex, hexToString, generateMap, findPath, getNeighbors } from './services/hexLogic';
import { generateTerrainWithGemini } from './services/geminiService';
import HexTile from './components/HexTile';
import { HEX_SIZE, MAP_RADIUS, TERRAIN_CONFIG, ROAD_COST } from './constants';
import { HexCoord, HexTileData, TerrainType } from './types';
import { Map as MapIcon, RefreshCw, MousePointer2, Info, Zap, Sparkles, Plus, Minus, Route } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [mapRadius, setMapRadius] = useState(MAP_RADIUS);
  const [mapData, setMapData] = useState<Map<string, HexTileData>>(new Map());
  const [playerPos, setPlayerPos] = useState<HexCoord>(createHex(0, 0));
  const [hoveredHex, setHoveredHex] = useState<HexCoord | null>(null);
  const [targetHex, setTargetHex] = useState<HexCoord | null>(null);
  const [path, setPath] = useState<HexCoord[]>([]);
  const [selectedTool, setSelectedTool] = useState<TerrainType | 'MOVE' | 'ROAD'>('MOVE');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genPrompt, setGenPrompt] = useState("A small town with roads connecting buildings and forests.");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize Map
  useEffect(() => {
    const initialMap = generateMap(mapRadius);
    setMapData(initialMap);
  }, []);

  // Pathfinding Calculation
  useEffect(() => {
    if (!hoveredHex || selectedTool !== 'MOVE') {
      if (targetHex && selectedTool === 'MOVE') {
         // Keep path to target if clicked
         const newPath = findPath(playerPos, targetHex, mapData);
         setPath(newPath);
      } else {
        setPath([]);
      }
      return;
    }

    // Calculate path on hover to preview
    const debouncePath = setTimeout(() => {
      const newPath = findPath(playerPos, hoveredHex, mapData);
      setPath(newPath);
    }, 10); 

    return () => clearTimeout(debouncePath);
  }, [playerPos, hoveredHex, mapData, selectedTool, targetHex]);

  // Handlers
  const handleRadiusChange = (delta: number) => {
    const newRadius = Math.max(2, Math.min(12, mapRadius + delta));
    if (newRadius === mapRadius) return;
    
    setMapRadius(newRadius);
    const newMap = generateMap(newRadius);
    setMapData(newMap);
    setPlayerPos(createHex(0, 0));
    setTargetHex(null);
    setPath([]);
  };

  const handleHexClick = (hex: HexCoord) => {
    const hexKey = hexToString(hex);
    const tile = mapData.get(hexKey);
    if (!tile) return;

    const newMap = new Map(mapData);

    if (selectedTool === 'MOVE') {
      // Move Logic
      if (tile.cost !== Infinity) {
        const movePath = findPath(playerPos, hex, mapData);
        if (movePath.length > 0) {
          setTargetHex(hex);
          animateMove(movePath);
        }
      }
    } else if (selectedTool === 'ROAD') {
      // Road Tool Logic
      if (tile.cost !== Infinity) {
        const hasRoad = !tile.hasRoad;
        const baseCost = TERRAIN_CONFIG[tile.terrain].cost;
        // Road overrides terrain cost if present
        const newCost = hasRoad ? ROAD_COST : baseCost;
        
        newMap.set(hexKey, { ...tile, hasRoad, cost: newCost });
        setMapData(newMap);
      }
    } else {
      // Terrain Paint Logic
      const config = TERRAIN_CONFIG[selectedTool];
      const isBlocking = config.cost === Infinity;
      const hasRoad = isBlocking ? false : (tile.hasRoad ?? false);
      const newCost = hasRoad ? ROAD_COST : config.cost;

      newMap.set(hexKey, { 
        ...tile, 
        terrain: selectedTool, 
        cost: newCost,
        hasRoad: hasRoad
      });
      setMapData(newMap);
    }
  };

  const animateMove = async (fullPath: HexCoord[]) => {
    for (let i = 0; i < fullPath.length; i++) {
      setPlayerPos(fullPath[i]);
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    setTargetHex(null);
  };

  const handleReset = () => {
    const newMap = generateMap(mapRadius);
    setMapData(newMap);
    setPlayerPos(createHex(0, 0));
    setTargetHex(null);
    setPath([]);
  };

  const handleAIGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const generatedHexes = await generateTerrainWithGemini(genPrompt, mapRadius);
      
      const newMap = generateMap(mapRadius);
      
      generatedHexes.forEach(gHex => {
        const hex = createHex(gHex.q, gHex.r);
        const key = hexToString(hex);
        if (newMap.has(key)) {
          const terrain = gHex.terrain || TerrainType.PLAINS;
          const config = TERRAIN_CONFIG[terrain];
          const hasRoad = gHex.hasRoad ?? false;
          
          let cost = config.cost;
          if (hasRoad && cost !== Infinity) {
             cost = ROAD_COST;
          }

          newMap.set(key, { ...hex, terrain, hasRoad, cost });
        }
      });
      
      // Ensure start is passable
      const startKey = hexToString(createHex(0,0));
      newMap.set(startKey, { ...createHex(0,0), terrain: TerrainType.PLAINS, cost: 1, hasRoad: false });

      setMapData(newMap);
      setPlayerPos(createHex(0, 0)); 
    } catch (e) {
      setErrorMsg("Failed to generate map. Check API Key.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Render Logic
  const mapArray = useMemo(() => Array.from(mapData.values()), [mapData]);

  const pixelRadius = (mapRadius + 1) * HEX_SIZE * 2;
  const viewBoxSize = pixelRadius * 2;
  const viewBox = `${-viewBoxSize/2} ${-viewBoxSize/2} ${viewBoxSize} ${viewBoxSize}`;

  return (
    <div className="flex h-screen w-full bg-gray-900 text-white overflow-hidden font-sans">
      
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 bg-gray-800 border-r border-gray-700 p-6 flex flex-col shadow-xl z-10 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2 text-green-400">
          <MapIcon /> HexPath AI
        </h1>
        <p className="text-xs text-gray-400 mb-6">A* Pathfinding & Generative Terrain</p>

        {/* Mode Selection */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Tools</h3>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => setSelectedTool('MOVE')}
              className={`p-3 rounded flex items-center gap-2 transition-colors ${selectedTool === 'MOVE' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              <MousePointer2 size={18} /> Move
            </button>
             <button 
              onClick={handleReset}
              className="p-3 rounded flex items-center gap-2 bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <RefreshCw size={18} /> Reset
            </button>
          </div>
        </div>

        {/* Map Settings */}
        <div className="mb-6">
           <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Map Size</h3>
           <div className="flex items-center justify-between bg-gray-700 p-2 rounded">
             <button onClick={() => handleRadiusChange(-1)} className="p-1 hover:bg-gray-600 rounded text-gray-300">
               <Minus size={18} />
             </button>
             <span className="font-mono font-bold">Radius: {mapRadius}</span>
             <button onClick={() => handleRadiusChange(1)} className="p-1 hover:bg-gray-600 rounded text-gray-300">
               <Plus size={18} />
             </button>
           </div>
        </div>

        {/* Map Editor (Scrollable) */}
        <div className="mb-6 flex-1 flex flex-col min-h-0">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Map Editor</h3>
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
             
             {/* Road Tool */}
             <button
                onClick={() => setSelectedTool('ROAD')}
                className={`p-2 text-xs rounded flex flex-col items-center justify-center gap-1 border transition-all h-20 ${
                  selectedTool === 'ROAD' 
                    ? 'bg-gray-700 border-yellow-500 ring-1 ring-yellow-500' 
                    : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                }`}
               >
                 <Route className="text-gray-400" size={20}/>
                 Road
               </button>

            {Object.values(TerrainType).map((t) => (
               <button
                key={t}
                onClick={() => setSelectedTool(t)}
                className={`p-2 text-xs rounded flex flex-col items-center justify-center gap-1 border transition-all h-20 ${
                  selectedTool === t 
                    ? 'bg-gray-700 border-green-500 ring-1 ring-green-500' 
                    : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                }`}
               >
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: TERRAIN_CONFIG[t].color }}></div>
                  <span className="text-center leading-tight">{t.replace('_', ' ')}</span>
               </button>
            ))}
          </div>
        </div>

        {/* AI Generator */}
        <div className="mt-auto bg-gray-900 p-4 rounded-xl border border-gray-700 shrink-0">
           <h3 className="text-sm font-semibold text-purple-400 mb-3 uppercase tracking-wider flex items-center gap-2">
             <Sparkles size={16} /> AI Generation
           </h3>
           <textarea 
             className="w-full bg-gray-800 text-sm p-2 rounded border border-gray-700 mb-3 text-gray-200 focus:outline-none focus:border-purple-500"
             rows={3}
             value={genPrompt}
             onChange={(e) => setGenPrompt(e.target.value)}
             placeholder="Describe the map..."
           />
           <button 
            onClick={handleAIGenerate}
            disabled={isGenerating}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 text-white p-2 rounded font-medium flex items-center justify-center gap-2 transition-all"
           >
             {isGenerating ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div> : <Zap size={16}/>}
             Generate
           </button>
           {errorMsg && <p className="text-red-400 text-xs mt-2">{errorMsg}</p>}
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {/* Grid Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>

        <div className="relative w-full h-full overflow-auto no-scrollbar flex items-center justify-center cursor-crosshair">
          <svg 
            width="100%" 
            height="100%" 
            viewBox={viewBox}
            className="max-w-full max-h-full select-none drop-shadow-2xl"
          >
            <g>
              {mapArray.map((tile) => {
                const key = hexToString(tile);
                const isPlayerPos = hexToString(playerPos) === key;
                const isPathHex = path.some(p => hexToString(p) === key) && !isPlayerPos;
                
                // Calculate Road Neighbors for rendering
                const neighborCoords = getNeighbors(tile);
                const roadNeighbors = neighborCoords.map(n => {
                   const nTile = mapData.get(hexToString(n));
                   return !!nTile?.hasRoad;
                });

                return (
                  <HexTile
                    key={key}
                    hex={tile}
                    terrain={tile.terrain}
                    hasRoad={tile.hasRoad}
                    roadNeighbors={roadNeighbors}
                    isHovered={selectedTool !== 'MOVE' && hoveredHex ? hexToString(hoveredHex) === key : false}
                    isPath={isPathHex}
                    isTarget={targetHex ? hexToString(targetHex) === key : false}
                    isStart={isPlayerPos}
                    onClick={handleHexClick}
                    onMouseEnter={setHoveredHex}
                  />
                );
              })}
            </g>
          </svg>
        </div>

        {/* HUD Overlay */}
        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md p-4 rounded-lg border border-gray-700 text-sm max-w-xs">
           <h4 className="font-bold text-gray-200 mb-2">Terrain Costs</h4>
           <div className="grid grid-cols-2 gap-x-4 gap-y-1 max-h-40 overflow-y-auto scrollbar-thin">
              {Object.values(TerrainType).map(t => (
                <div key={t} className="flex items-center gap-2 text-gray-400">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: TERRAIN_CONFIG[t].color }}></div>
                  <span className="text-xs">{TERRAIN_CONFIG[t].label}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 text-gray-400">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  <span className="text-xs">Road ({ROAD_COST})</span>
              </div>
           </div>
           <div className="mt-3 border-t border-gray-700 pt-2 text-xs text-gray-500">
             Path Cost: {path.length > 0 ? path.reduce((acc, curr) => {
               const tile = mapData.get(hexToString(curr));
               return acc + (tile && tile.cost !== Infinity ? tile.cost : 0);
             }, 0) : 0}
           </div>
        </div>
      </div>
    </div>
  );
};

export default App;
