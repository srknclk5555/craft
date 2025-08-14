import { useState } from 'react';
import { Profession, Recipe, Prices, XpBonuses } from '@/types/crafting';
import { xpTable } from '@/data/xpTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Coins, Percent } from 'lucide-react';

interface CalculatorProps {
  profession: Profession;
  selectedRecipe: Recipe | null;
  prices: Prices;
  onSetPricesClick: () => void;
  xpBonuses: XpBonuses;
}

interface CalculationResult {
  xpToGain: number;
  craftsNeeded: number;
  materials: { name: string; quantity: number }[];
  totalCost: number;
  totalRevenue: number;
  profit: number;
  totalBonusPercentage: number;
}

export function Calculator({ profession, selectedRecipe, prices, onSetPricesClick, xpBonuses }: CalculatorProps) {
  const [targetLevel, setTargetLevel] = useState<number>(profession.level + 1);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = () => {
    setError(null);
    setResult(null);

    if (!selectedRecipe) {
      setError("Please select a recipe to use for the calculation.");
      return;
    }
    if (targetLevel <= profession.level) {
      setError("Target level must be higher than the current level.");
      return;
    }
    if (targetLevel > xpTable[xpTable.length - 1].level + 1) {
        setError(`The maximum level for calculation is ${xpTable[xpTable.length - 1].level + 1}.`);
        return;
    }

    // Bonus Calculation
    let totalBonusPercentage = 0;
    if (xpBonuses.gathererTitle) totalBonusPercentage += 10;
    if (xpBonuses.eggStuffedPeppers) totalBonusPercentage += 10;
    if (xpBonuses.serverExpEvent) totalBonusPercentage += 10;
    if (xpBonuses.kingExpEvent) totalBonusPercentage += 10;
    switch (xpBonuses.premium) {
      case 'craft': totalBonusPercentage += 30; break;
      case 'farm': totalBonusPercentage += 10; break;
      case 'exp': totalBonusPercentage += 10; break;
    }
    const xpPerCraftWithBonus = selectedRecipe.xp * (1 + totalBonusPercentage / 100);

    if (xpPerCraftWithBonus <= 0) {
      setError("The selected recipe provides no XP, so calculation is not possible.");
      return;
    }

    // XP Calculation
    const xpForCurrentLevel = xpTable.find(x => x.level === profession.level)?.xp ?? profession.xpToNextLevel;
    let xpNeeded = xpForCurrentLevel - profession.currentXp;

    for (let i = profession.level + 1; i < targetLevel; i++) {
      const levelData = xpTable.find(x => x.level === i);
      if (levelData) {
        xpNeeded += levelData.xp;
      } else {
        setError(`XP data for level ${i} is missing.`);
        return;
      }
    }

    if (xpNeeded <= 0) {
        setResult({
          xpToGain: 0,
          craftsNeeded: 0,
          materials: [],
          totalCost: 0,
          totalRevenue: 0,
          profit: 0,
          totalBonusPercentage,
        });
        return;
    }

    // Crafting Calculation
    const craftsNeeded = Math.ceil(xpNeeded / xpPerCraftWithBonus);
    const totalMaterials = selectedRecipe.materials.map(mat => ({
      name: mat.name,
      quantity: mat.quantity * craftsNeeded,
    }));

    // Cost Calculation
    const totalCost = totalMaterials.reduce((acc, mat) => {
      const price = prices[mat.name] || 0;
      return acc + (mat.quantity * price);
    }, 0);
    
    const productPrice = prices[selectedRecipe.name] || 0;
    const totalRevenue = craftsNeeded * productPrice;
    const profit = totalRevenue - totalCost;

    setResult({
      xpToGain: xpNeeded,
      craftsNeeded,
      materials: totalMaterials,
      totalCost,
      totalRevenue,
      profit,
      totalBonusPercentage,
    });
  };

  return (
    <Card className="mt-6 bg-[#1a1c25] border-[#2a2d3a]">
      <CardHeader>
        <CardTitle className="text-white">Crafting Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-6 items-end">
          {/* Inputs */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Target Level</label>
            <Input
              type="number"
              value={targetLevel}
              onChange={(e) => setTargetLevel(parseInt(e.target.value, 10) || 0)}
              min={profession.level + 1}
              className="bg-[#0f111a] border-[#2a2d3a] focus:border-[#a47e3b] focus:ring-[#a47e3b]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Recipe to Craft</label>
            <div className="h-10 flex items-center px-3 rounded-md border border-[#2a2d3a] bg-[#0f111a]">
              <span className="text-gray-300 truncate">{selectedRecipe?.name || 'None selected'}</span>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button onClick={onSetPricesClick} variant="outline" className="w-full border-[#a47e3b] text-[#a47e3b] hover:bg-[#a47e3b] hover:text-white">
              <Coins className="mr-2 h-4 w-4" /> Set Prices
            </Button>
            <Button onClick={handleCalculate} className="w-full bg-[#a47e3b] text-white hover:bg-[#b8914a]">
              Calculate
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-4 bg-red-900/20 border-red-500/50 text-red-400">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="mt-6 border-t border-[#2a2d3a] pt-6">
            <h3 className="text-xl font-semibold text-white mb-4">Calculation Results</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Result Cards */}
              <Card className="bg-[#0f111a] border-[#2a2d3a]">
                <CardHeader><CardTitle className="text-base text-gray-400">XP to Gain</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold text-white">{result.xpToGain.toLocaleString()}</p></CardContent>
              </Card>
              <Card className="bg-[#0f111a] border-[#2a2d3a]">
                <CardHeader><CardTitle className="text-base text-gray-400">Crafts Needed</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold text-white">{result.craftsNeeded.toLocaleString()}x <span className="text-lg text-gray-300">{selectedRecipe?.name}</span></p></CardContent>
              </Card>
              <Card className="bg-[#0f111a] border-[#2a2d3a]">
                <CardHeader><CardTitle className="text-base text-gray-400">Total XP Bonus</CardTitle></CardHeader>
                <CardContent className="flex items-baseline">
                  <p className="text-2xl font-bold text-blue-400">+{result.totalBonusPercentage.toLocaleString()}</p>
                  <Percent className="w-5 h-5 text-blue-400 ml-1" />
                </CardContent>
              </Card>
              <Card className="bg-[#0f111a] border-[#2a2d3a]">
                <CardHeader><CardTitle className="text-base text-gray-400">Total Cost</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold text-red-400">{result.totalCost.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p></CardContent>
              </Card>
              <Card className="bg-[#0f111a] border-[#2a2d3a]">
                <CardHeader><CardTitle className="text-base text-gray-400">Profit / Loss</CardTitle></CardHeader>
                <CardContent><p className={`text-2xl font-bold ${result.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{result.profit.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p></CardContent>
              </Card>
            </div>
            <div className="mt-4">
              <h4 className="font-semibold text-white mb-2">Required Materials</h4>
              <ul className="space-y-1 list-disc list-inside text-gray-300">
                {result.materials.map(mat => (
                  <li key={mat.name}>
                    <span className="font-semibold">{mat.quantity.toLocaleString()}x</span> {mat.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
