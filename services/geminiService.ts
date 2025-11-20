
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedHex, TerrainType } from "../types";

export const generateTerrainWithGemini = async (
  description: string,
  radius: number
): Promise<GeneratedHex[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY not found in environment");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Construct a prompt that explains the hex coordinate system briefly
  const prompt = `
    Generate a hex grid map with a radius of ${radius}.
    The grid uses axial coordinates (q, r).
    The map should match this description: "${description}".
    
    Available terrain types: 
    - PLAINS
    - FOREST (Light, cost 2)
    - DENSE_FOREST (Heavy, cost 3)
    - MOUNTAIN
    - WATER
    - SAND
    - WALL
    - SMALL_BUILDING
    - BIG_BUILDING

    You can also specify "hasRoad": true for hexes that should have roads. Roads reduce movement cost.
    Ensure the map is interesting and playable. 
    Do not completely wall off the center (0,0) as that is the player start.
    Return a list of hexes that have specific terrain or roads. Any hex not listed will default to PLAINS.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              q: { type: Type.INTEGER },
              r: { type: Type.INTEGER },
              hasRoad: { type: Type.BOOLEAN },
              terrain: { 
                type: Type.STRING, 
                enum: [
                  TerrainType.PLAINS, 
                  TerrainType.FOREST, 
                  TerrainType.DENSE_FOREST,
                  TerrainType.MOUNTAIN, 
                  TerrainType.WATER, 
                  TerrainType.SAND, 
                  TerrainType.WALL,
                  TerrainType.SMALL_BUILDING,
                  TerrainType.BIG_BUILDING
                ] 
              }
            },
            required: ["q", "r"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as GeneratedHex[];
    }
    return [];
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
