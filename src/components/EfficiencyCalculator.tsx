import { useState, useEffect } from 'react';
import { Profession, Prices, XpBonuses, CraftingStep, Recipe, CalculationPath } from '@/types/crafting';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Zap, ArrowRight, Target, Coins, Package, Gem, Scale } from 'lucide-react';
import { xpTable } from '@/data/xpTable';
import { Badge } from '@/components/ui/badge';

interface EfficiencyCalculatorProps {
  profession: Profession;
  prices: Prices;
  xpBonuses: XpBonuses;
}

interface DiscoveredChain {
  startMaterial: string;
  startMaterialRecipe: Recipe;
  steps: Recipe[];
  totalBaseXp: number;
  requiredLevel: number;
  xpPerRawMaterial: number;
  finalOutput: { name: string; quantity: number };
}

export function EfficiencyCalculator({ profession, prices, xpBonuses }: EfficiencyCalculatorProps) {
  const [material, setMaterial] = useState('');
  const [quantity, setQuantity] = useState<number>(100);
  const [targetLevel, setTargetLevel] = useState<number | ''>('');
  const [result, setResult] = useState<CalculationPath[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'material' | 'level'>('material');

  useEffect(() => {
    setResult(null);
    setError(null);
    setMaterial('');
    setQuantity(100);
  }, [profession]);

  useEffect(() => {
    setMode(targetLevel ? 'level' : 'material');
    if (targetLevel) {
      setMaterial('');
      setQuantity(0);
    } else {
      setQuantity(100);
    }
  }, [targetLevel]);

  const calculateTotalBonus = (bonuses: XpBonuses): number => {
    let total = 0;
    if (bonuses.gathererTitle) total += 0.10;
    if (bonuses.eggStuffedPeppers) total += 0.10;
    if (bonuses.serverExpEvent) total += 0.10;
    if (bonuses.kingExpEvent) total += 0.10;

    switch (bonuses.premium) {
      case 'craft':
        total += 0.30;
        break;
      case 'farm':
      case 'exp':
        total += 0.10;
        break;
      default:
        break;
    }
    return total;
  };

  const discoverChains = (): DiscoveredChain[] => {
    const craftableItems = new Set(profession.recipes.map(r => r.outputItemName));
    const recipesByInput = new Map<string, Recipe[]>();
    profession.recipes.forEach(recipe => {
      recipe.materials.forEach(mat => {
        const existing = recipesByInput.get(mat.name) || [];
        recipesByInput.set(mat.name, [...existing, recipe]);
      });
    });

    const chains: DiscoveredChain[] = [];

    profession.recipes.forEach(startRecipe => {
      const rawMaterials = startRecipe.materials.filter(m => !craftableItems.has(m.name));
      if (rawMaterials.length > 0 && startRecipe.materials.length === 1) {
        const chainSteps: Recipe[] = [startRecipe];
        let currentOutput = startRecipe.outputItemName;
        let nextRecipes = recipesByInput.get(currentOutput);

        while (nextRecipes && nextRecipes.length === 1) {
          const nextRecipe = nextRecipes[0];
          if (chainSteps.find(s => s.id === nextRecipe.id)) break; // Avoid loops
          chainSteps.push(nextRecipe);
          currentOutput = nextRecipe.outputItemName;
          nextRecipes = recipesByInput.get(currentOutput);
        }

        let totalBaseXp = 0;
        let rawMaterialCost = startRecipe.materials[0].quantity;
        let itemsProduced = new Map<string, number>();
        itemsProduced.set(startRecipe.outputItemName, startRecipe.outputQuantity);
        totalBaseXp += startRecipe.xp;

        for (let i = 1; i < chainSteps.length; i++) {
          const step = chainSteps[i];
          const inputName = step.materials[0].name;
          const inputNeeded = step.materials[0].quantity;
          const inputAvailable = itemsProduced.get(inputName) || 0;
          if (inputAvailable >= inputNeeded) {
            const crafts = Math.floor(inputAvailable / inputNeeded);
            totalBaseXp += crafts * step.xp;
            itemsProduced.set(inputName, inputAvailable - (crafts * inputNeeded));
            itemsProduced.set(step.outputItemName, (itemsProduced.get(step.outputItemName) || 0) + (crafts * step.outputQuantity));
          }
        }
        
        const finalStep = chainSteps[chainSteps.length - 1];
        const finalOutputQty = itemsProduced.get(finalStep.outputItemName) || 0;

        chains.push({
          startMaterial: rawMaterials[0].name,
          startMaterialRecipe: startRecipe,
          steps: chainSteps,
          totalBaseXp,
          requiredLevel: Math.max(...chainSteps.map(r => r.requiredLevel)),
          xpPerRawMaterial: totalBaseXp / rawMaterialCost,
          finalOutput: { name: finalStep.outputItemName, quantity: finalOutputQty }
        });
      }
    });
    return chains;
  };

  const handleCalculate = () => {
    setError(null);
    setResult(null);

    const xpMultiplier = 1 + calculateTotalBonus(xpBonuses);
    const chains = discoverChains();

    if (mode === 'level') {
      if (!targetLevel || targetLevel <= profession.level) {
        setError("Hedef level, mevcut level'den yüksek olmalıdır.");
        return;
      }
      
      if (chains.length === 0) {
        setError("Bu meslek için otomatik seviye atlama yolu hesaplanamadı. Lütfen materyal modunu kullanın.");
        return;
      }

      const levelBlocks: { from: number, to: number, chain: DiscoveredChain }[] = [];
      const sortedChains = chains.sort((a, b) => b.requiredLevel - a.requiredLevel);

      for (let lvl = profession.level; lvl < targetLevel; lvl++) {
        const bestChainForLvl = sortedChains.find(c => c.requiredLevel <= lvl);
        if (!bestChainForLvl) continue;

        if (levelBlocks.length === 0 || levelBlocks[levelBlocks.length - 1].chain.startMaterial !== bestChainForLvl.startMaterial) {
          levelBlocks.push({ from: lvl, to: lvl, chain: bestChainForLvl });
        } else {
          levelBlocks[levelBlocks.length - 1].to = lvl;
        }
      }

      const steps: CraftingStep[] = [];
      const baseMaterials: { [name: string]: number } = {};
      let totalXpGained = 0;

      for (const block of levelBlocks) {
        let xpForBlock = 0;
        for (let lvl = block.from; lvl <= block.to; lvl++) {
          const xpData = xpTable.find(x => x.level === lvl);
          if (!xpData) continue;
          if (lvl === profession.level) {
            xpForBlock += xpData.xp - profession.currentXp;
          } else {
            xpForBlock += xpData.xp;
          }
        }

        if (xpForBlock <= 0) continue;

        const totalXpPerChainWithBonus = block.chain.totalBaseXp * xpMultiplier;
        const chainsNeeded = Math.ceil(xpForBlock / totalXpPerChainWithBonus);
        if (chainsNeeded <= 0) continue;

        const rawMaterialName = block.chain.startMaterial;
        const rawMaterialPerChain = block.chain.startMaterialRecipe.materials[0].quantity;
        const rawMaterialNeeded = chainsNeeded * rawMaterialPerChain;
        baseMaterials[rawMaterialName] = (baseMaterials[rawMaterialName] || 0) + rawMaterialNeeded;

        let itemsProduced = new Map<string, number>();
        itemsProduced.set(rawMaterialName, rawMaterialNeeded);
        
        const blockTitle = block.from === block.to ? `Seviye ${block.from}` : `Seviye ${block.from} - ${block.to}`;

        for(const recipe of block.chain.steps) {
          const inputMat = recipe.materials[0];
          const inputAvailable = itemsProduced.get(inputMat.name) || 0;
          const crafts = Math.floor(inputAvailable / inputMat.quantity);
          if (crafts === 0) continue;

          const xpGained = crafts * recipe.xp * xpMultiplier;
          totalXpGained += xpGained;

          steps.push({
            recipeName: recipe.name,
            crafts: crafts,
            xpGained: xpGained,
            inputMaterial: { name: inputMat.name, quantity: crafts * inputMat.quantity },
            outputMaterial: { name: recipe.outputItemName, quantity: crafts * recipe.outputQuantity },
            blockTitle: steps.length === 0 || steps[steps.length-1].blockTitle !== blockTitle ? blockTitle : undefined,
          });

          itemsProduced.set(inputMat.name, inputAvailable - (crafts * inputMat.quantity));
          itemsProduced.set(recipe.outputItemName, (itemsProduced.get(recipe.outputItemName) || 0) + (crafts * recipe.outputQuantity));
        }
      }

      const totalCost = Object.entries(baseMaterials).reduce((acc, [name, quantity]) => acc + (prices[name] || 0) * quantity, 0);
      
      const finalProducts = steps.reduce((acc, step) => {
        const name = step.outputMaterial.name;
        const isInputForOther = steps.some(s => s.inputMaterial.name === name);
        if (!isInputForOther) {
           acc[name] = (acc[name] || 0) + step.outputMaterial.quantity;
        }
        // Subtract used materials
        const inputName = step.inputMaterial.name;
        if(acc[inputName]) {
            acc[inputName] -= step.inputMaterial.quantity;
            if(acc[inputName] <= 0) delete acc[inputName];
        }
        return acc;
      }, {} as { [name: string]: number });


      const finalProductValue = Object.entries(finalProducts).reduce((acc, [name, quantity]) => acc + (prices[name] || 0) * quantity, 0);
      const netCost = totalCost - finalProductValue;

      const resultPath: CalculationPath = {
        isLevelingPath: true,
        pathTitle: `Yol Haritası: Seviye ${profession.level} → ${targetLevel}`,
        totalXp: totalXpGained,
        totalCost,
        baseMaterials: Object.entries(baseMaterials).map(([name, quantity]) => ({ name, quantity })),
        steps,
        startingMaterial: { name: '', quantity: 0 },
        finalProducts: Object.entries(finalProducts).map(([name, quantity]) => ({ name, quantity })),
        finalProductValue,
        netCost,
      };

      setResult([resultPath]);

    } else { // Material mode
      if (!material || quantity <= 0) {
        setError("Lütfen geçerli bir ham madde ve miktar girin.");
        return;
      }
      
      const relevantChains = chains.filter(c => c.startMaterial.toLowerCase() === material.toLowerCase());
      if (relevantChains.length === 0) {
        setError(`'${material}' ile başlayan bir üretim zinciri bu meslekte bulunamadı.`);
        return;
      }

      const bestChain = relevantChains.sort((a, b) => b.steps.length - a.steps.length)[0];
      
      const pathSteps: CraftingStep[] = [];
      let totalXpGained = 0;
      let itemsProduced = new Map<string, number>();
      itemsProduced.set(material, quantity);

      for (const recipe of bestChain.steps) {
        const inputMat = recipe.materials[0];
        const inputAvailable = itemsProduced.get(inputMat.name) || 0;
        const crafts = Math.floor(inputAvailable / inputMat.quantity);
        if (crafts === 0) break;

        const xpGained = crafts * recipe.xp * xpMultiplier;
        totalXpGained += xpGained;

        pathSteps.push({
          recipeName: recipe.name,
          crafts: crafts,
          xpGained: xpGained,
          inputMaterial: { name: inputMat.name, quantity: crafts * inputMat.quantity },
          outputMaterial: { name: recipe.outputItemName, quantity: crafts * recipe.outputQuantity },
        });

        itemsProduced.set(inputMat.name, inputAvailable - (crafts * inputMat.quantity));
        itemsProduced.set(recipe.outputItemName, (itemsProduced.get(recipe.outputItemName) || 0) + (crafts * recipe.outputQuantity));
      }

      const finalProducts = Array.from(itemsProduced.entries())
        .filter(([name]) => name !== material)
        .map(([name, quantity]) => ({ name, quantity }));

      const finalProductValue = finalProducts.reduce((total, product) => total + (prices[product.name] || 0) * product.quantity, 0);
      const totalCost = (prices[material] || 0) * quantity;
      const netCost = totalCost - finalProductValue;

      const resultPath: CalculationPath = {
        pathTitle: `Optimal Yol: ${bestChain.steps.map(s => s.name).join(' → ')}`,
        totalXp: totalXpGained,
        totalCost: totalCost,
        startingMaterial: { name: material, quantity: quantity },
        steps: pathSteps,
        finalProducts: finalProducts,
        finalProductValue: finalProductValue,
        netCost: netCost,
      };
      setResult([resultPath]);
    }
  };

  const totalBonusDisplay = calculateTotalBonus(xpBonuses);

  return (
    <Card className="mt-6 bg-[#1a1c25] border-[#2a2d3a]">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Zap className="mr-2 text-[#a47e3b]" />
          Verimlilik Hesaplayıcı (XP Zinciri)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-4 gap-6 items-end">
          <div className="space-y-2">
            <label className={`text-sm font-medium ${mode === 'level' ? 'text-gray-600' : 'text-gray-400'}`}>Ham Madde</label>
            <Input
              placeholder={mode === 'level' ? "Hedef seçili..." : "Örn: Oak Wood"}
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="bg-[#0f111a] border-[#2a2d3a] focus:border-[#a47e3b] focus:ring-[#a47e3b] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={mode === 'level'}
            />
          </div>
          <div className="space-y-2">
            <label className={`text-sm font-medium ${mode === 'level' ? 'text-gray-600' : 'text-gray-400'}`}>Miktar</label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
              min={1}
              className="bg-[#0f111a] border-[#2a2d3a] focus:border-[#a47e3b] focus:ring-[#a47e3b] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={mode === 'level'}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center">
              <Target className="w-4 h-4 mr-1.5"/>
              Hedef Level (Opsiyonel)
            </label>
            <Input
              type="number"
              placeholder={`Mevcut: ${profession.level}`}
              value={targetLevel}
              onChange={(e) => setTargetLevel(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              min={profession.level + 1}
              className="bg-[#0f111a] border-[#2a2d3a] focus:border-[#a47e3b] focus:ring-[#a47e3b]"
            />
          </div>
          <Button onClick={handleCalculate} className="w-full bg-[#a47e3b] text-white hover:bg-[#b8914a]">
            {mode === 'level' ? 'Yol Haritası Çıkar' : 'Verimi Hesapla'}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-4 bg-red-900/20 border-red-500/50 text-red-400">
            <AlertTitle>Hata</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="mt-6 border-t border-[#2a2d3a] pt-6 space-y-6">
            {result.map((path, index) => (
              <div key={index} className="p-4 rounded-lg bg-[#0f111a] border border-[#2a2d3a]">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-[#a47e3b]">{path.pathTitle}</h3>
                  {totalBonusDisplay > 0 && (
                    <Badge variant="secondary" className="bg-green-800/50 text-green-300 border-green-500/50">
                      Aktif Bonus: +{(totalBonusDisplay * 100).toFixed(0)}%
                    </Badge>
                  )}
                </div>
                
                {path.isLevelingPath ? (
                  // Target Level Mode View
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
                      <div className="p-3 bg-[#1a1c25] rounded-md">
                        <p className="text-xs text-gray-400 flex items-center justify-center"><Package className="w-4 h-4 mr-1.5"/>Gereken Ham Maddeler</p>
                        <div className="font-bold text-white mt-1 text-sm">
                          {path.baseMaterials?.map(m => `${m.quantity.toLocaleString()}x ${m.name}`).join(', ')}
                        </div>
                      </div>
                      <div className="p-3 bg-[#1a1c25] rounded-md">
                        <p className="text-xs text-gray-400 flex items-center justify-center"><Coins className="w-4 h-4 mr-1.5"/>Tahmini Maliyet</p>
                        <p className="font-bold text-white mt-1">{path.totalCost.toLocaleString()} Altın</p>
                      </div>
                      <div className="p-3 bg-[#1a1c25] rounded-md">
                        <p className="text-xs text-gray-400 flex items-center justify-center"><Gem className="w-4 h-4 mr-1.5"/>Son Ürün</p>
                        <div className="font-bold text-white mt-1 text-sm">
                          {path.finalProducts.map(p => `${p.quantity.toLocaleString()}x ${p.name}`).join(', ')}
                        </div>
                        <p className="font-bold text-green-400 text-xs">{path.finalProductValue.toLocaleString()} Altın</p>
                      </div>
                      <div className="p-3 bg-[#1a1c25] rounded-md">
                        <p className="text-xs text-gray-400 flex items-center justify-center"><Scale className="w-4 h-4 mr-1.5"/>Net Maliyet</p>
                        <p className={`font-bold mt-1 ${path.netCost > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {path.netCost.toLocaleString()} Altın
                        </p>
                      </div>
                      <div className="p-3 bg-[#1a1c25] rounded-md">
                        <p className="text-xs text-gray-400 flex items-center justify-center"><Zap className="w-4 h-4 mr-1.5"/>Kazanılacak XP</p>
                        <p className="font-bold text-xl text-green-400">{Math.round(path.totalXp).toLocaleString()} XP</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-md font-semibold text-gray-300 mb-2">Üretim Adımları:</h4>
                      <div className="space-y-2">
                        {path.steps.map((step, stepIndex) => (
                          <div key={stepIndex} className="flex items-center justify-between text-sm p-2 rounded bg-[#1f222e]">
                            <div className="flex items-center flex-wrap">
                              {step.blockTitle && (
                                <span className="font-bold text-blue-400 mr-2">{step.blockTitle}:</span>
                              )}
                              {!step.blockTitle && stepIndex > 0 && path.steps[stepIndex-1].recipeName !== step.recipeName && (
                                <ArrowRight className="w-4 h-4 text-gray-500 mr-2 ml-4" />
                              )}
                              <span className="text-gray-300">{step.crafts.toLocaleString()}x <span className="font-semibold text-white">{step.recipeName}</span></span>
                              <ArrowRight className="w-4 h-4 text-gray-500 mx-2" />
                              <span className="font-semibold text-white">{step.outputMaterial.quantity.toLocaleString()}x {step.outputMaterial.name}</span>
                            </div>
                            <span className="font-semibold text-green-400 whitespace-nowrap ml-2">+{Math.round(step.xpGained).toLocaleString()} XP</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Material Mode View
                  <div>
                    <div className="flex items-center justify-around flex-wrap mb-4 p-3 bg-[#1a1c25] rounded-md gap-4">
                        <div className="text-center">
                            <p className="text-xs text-gray-400">Başlangıç</p>
                            <p className="font-bold text-white">{path.startingMaterial.quantity.toLocaleString()}x {path.startingMaterial.name}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-gray-400">Maliyet</p>
                            <p className="font-bold text-white">{path.totalCost.toLocaleString()} Altın</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-gray-400">Son Ürünler</p>
                            <p className="font-bold text-white">{path.finalProducts.map(p => `${p.quantity.toLocaleString()}x ${p.name}`).join(', ')}</p>
                            <p className="font-bold text-green-400 text-xs">{path.finalProductValue.toLocaleString()} Altın</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-gray-400">Net Maliyet</p>
                            <p className={`font-bold ${path.netCost > 0 ? 'text-red-400' : 'text-green-400'}`}>{path.netCost.toLocaleString()} Altın</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-gray-400">Toplam Kazanç</p>
                            <p className="font-bold text-xl text-green-400">{Math.round(path.totalXp).toLocaleString()} XP</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                      {path.steps.map((step, stepIndex) => (
                        <div key={stepIndex} className="flex items-center justify-between text-sm p-2 rounded bg-[#1f222e]">
                          <div className="flex items-center flex-wrap">
                            <span className="font-bold text-blue-400 mr-2">Adım {stepIndex + 1}:</span>
                            <span className="text-gray-300">{step.inputMaterial.quantity.toLocaleString()}x {step.inputMaterial.name}</span>
                            <ArrowRight className="w-4 h-4 text-gray-500 mx-2" />
                            <span className="text-gray-300">{step.crafts.toLocaleString()}x <span className="font-semibold text-white">{step.recipeName}</span></span>
                            <ArrowRight className="w-4 h-4 text-gray-500 mx-2" />
                            <span className="font-semibold text-white">{step.outputMaterial.quantity.toLocaleString()}x {step.outputMaterial.name}</span>
                          </div>
                          <span className="font-semibold text-green-400 whitespace-nowrap ml-2">+{Math.round(step.xpGained).toLocaleString()} XP</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
