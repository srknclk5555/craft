import { Recipe } from "@/types/crafting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calculator } from "lucide-react";

interface RecipeCardProps {
  recipe: Recipe;
  playerLevel: number;
  onSelectForCalc: (recipe: Recipe) => void;
  isSelectedForCalc: boolean;
}

export function RecipeCard({ recipe, playerLevel, onSelectForCalc, isSelectedForCalc }: RecipeCardProps) {
  const canCraft = playerLevel >= recipe.requiredLevel;

  return (
    <Card className={`bg-[#0f111a] border-[#2a2d3a] transition-all duration-300 ${isSelectedForCalc ? 'border-[#a47e3b] ring-2 ring-[#a47e3b]' : ''}`}>
      <CardHeader className="flex flex-row justify-between items-start pb-2">
        <div>
          <CardTitle className="text-lg font-semibold text-white">{recipe.name}</CardTitle>
          <p className="text-sm text-gray-400">Requires Level {recipe.requiredLevel}</p>
        </div>
        <Badge variant={canCraft ? "default" : "destructive"} className={canCraft ? 'bg-green-800/50 text-green-300 border-green-500/50' : 'bg-red-800/50 text-red-300 border-red-500/50'}>
          {canCraft ? "Available" : "Locked"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-sm text-gray-400 mb-2">Materials:</p>
            <ul className="space-y-1 list-disc list-inside text-gray-300">
              {recipe.materials.map((mat) => (
                <li key={mat.name}>
                  {mat.quantity}x {mat.name}
                </li>
              ))}
            </ul>
          </div>
          <div className="text-right">
             <p className="text-sm text-gray-400">XP Gained</p>
             <p className="text-xl font-bold text-cyan-400">{recipe.xp}</p>
          </div>
        </div>
        <div className="border-t border-[#2a2d3a] mt-4 pt-4 flex justify-end">
            <Button 
              size="sm" 
              onClick={() => onSelectForCalc(recipe)}
              className={`bg-transparent border text-sm ${isSelectedForCalc ? 'border-green-500 text-green-400 hover:bg-green-500/10' : 'border-[#a47e3b] text-[#a47e3b] hover:bg-[#a47e3b]/10'}`}
            >
              {isSelectedForCalc ? <CheckCircle className="w-4 h-4 mr-2" /> : <Calculator className="w-4 h-4 mr-2" />}
              {isSelectedForCalc ? 'Selected' : 'Select for Calc'}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
