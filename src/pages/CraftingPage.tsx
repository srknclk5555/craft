import { useState, useEffect } from "react";
import { professions as initialProfessionsData } from "@/data/professions";
import { xpTable } from "@/data/xpTable";
import { Profession, Recipe, Prices, XpBonuses } from "@/types/crafting";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RecipeCard } from "@/components/RecipeCard";
import { Search, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { XpTableModal } from "@/components/XpTableModal";
import { PriceModal } from "@/components/PriceModal";
import { Calculator } from "@/components/Calculator";
import { XpBonusModal } from "@/components/XpBonusModal";
import { EfficiencyCalculator } from "@/components/EfficiencyCalculator";

// Set default values for all professions
const initialProfessions = initialProfessionsData.map(prof => ({
  ...prof,
  level: 1,
  currentXp: 0,
  xpToNextLevel: xpTable.find(x => x.level === 1)?.xp || 250, // XP for level 1
}));

export function CraftingPage() {
  const [professions, setProfessions] = useState<Profession[]>(initialProfessions);
  const [selectedProfession, setSelectedProfession] = useState<Profession>(professions.find(p => p.id === 'carpentry') || professions[0]);
  const [editingProfession, setEditingProfession] = useState<Profession | null>(null);
  const [isXpModalOpen, setIsXpModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isXpBonusModalOpen, setIsXpBonusModalOpen] = useState(false);
  const [prices, setPrices] = useState<Prices>({});
  const [selectedRecipeForCalc, setSelectedRecipeForCalc] = useState<Recipe | null>(null);
  const [xpBonuses, setXpBonuses] = useState<XpBonuses>({
    gathererTitle: false,
    premium: 'none',
    eggStuffedPeppers: false,
    serverExpEvent: false,
    kingExpEvent: false,
  });

  const handleProfessionClick = (prof: Profession) => {
    setSelectedProfession(prof);
    setSelectedRecipeForCalc(null); // Reset calculator recipe on profession change
  };

  const handleEditClick = (prof: Profession) => {
    setEditingProfession(prof);
  };

  const handleSave = () => {
    if (!editingProfession) return;

    let professionToUpdate = { ...editingProfession };

    const levelData = xpTable.find(x => x.level === professionToUpdate.level);
    if (levelData) {
      professionToUpdate.xpToNextLevel = levelData.xp;
    } else {
      const maxLevelEntry = xpTable[xpTable.length - 1];
      if (professionToUpdate.level >= maxLevelEntry.level) {
        professionToUpdate.xpToNextLevel = maxLevelEntry.xp;
      } else if (professionToUpdate.level < 1) {
        professionToUpdate.level = 1;
        professionToUpdate.xpToNextLevel = xpTable[0].xp;
      }
    }

    const newProfessions = professions.map(p =>
      p.id === professionToUpdate.id ? professionToUpdate : p
    );
    
    setProfessions(newProfessions);
    setSelectedProfession(professionToUpdate);
    setEditingProfession(null);
  };

  const handleCancel = () => {
    setEditingProfession(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingProfession) return;
    const { name, value } = e.target;
    setEditingProfession({
      ...editingProfession,
      [name]: parseInt(value, 10) || 0,
    });
  };

  const handleSavePrices = (newPrices: Prices) => {
    setPrices(newPrices);
  };
  
  const handleSaveBonuses = (newBonuses: XpBonuses) => {
    setXpBonuses(newBonuses);
  };

  const handleSelectRecipeForCalc = (recipe: Recipe) => {
    setSelectedRecipeForCalc(recipe.id === selectedRecipeForCalc?.id ? null : recipe);
  };

  const xpPercentage = (selectedProfession.currentXp / selectedProfession.xpToNextLevel) * 100;

  const learnedRecipes = selectedProfession.recipes.filter(
    (recipe) => recipe.requiredLevel <= selectedProfession.level
  );

  const unlearnedRecipes = selectedProfession.recipes.filter(
    (recipe) => recipe.requiredLevel > selectedProfession.level
  );

  return (
    <>
      <div className="min-h-screen bg-[#0f111a] text-gray-200 flex p-4 font-sans">
        {/* Sidebar */}
        <aside className="w-20 bg-[#1a1c25] rounded-lg flex flex-col items-center py-4 space-y-2">
          {professions.map((prof) => (
            <button
              key={prof.id}
              onClick={() => handleProfessionClick(prof)}
              onDoubleClick={() => handleEditClick(prof)}
              className={`p-3 rounded-lg transition-colors duration-200 ${
                selectedProfession.id === prof.id
                  ? "bg-[#a47e3b] text-white"
                  : "text-gray-400 hover:bg-[#2a2d3a]"
              }`}
              title={`${prof.name} (Double-click to edit)`}
            >
              <prof.Icon className="w-6 h-6" />
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-4">
          <div className="p-6 bg-[#1a1c25] rounded-lg">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white">{selectedProfession.name}</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge className="text-lg bg-transparent border-[#a47e3b] text-[#a47e3b]">
                    Lv. {selectedProfession.level}
                  </Badge>
                  <div className="w-64">
                    <Progress value={xpPercentage} className="h-2 bg-[#2a2d3a]" indicatorClassName="xp-bar-progress" />
                  </div>
                  <span className="text-sm text-gray-400 font-mono">
                    {selectedProfession.currentXp} / {selectedProfession.xpToNextLevel} XP
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditClick(selectedProfession)}
                    className="text-gray-400 hover:text-white hover:bg-[#2a2d3a] h-8 w-8"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => setIsXpBonusModalOpen(true)}
                  className="bg-transparent border border-[#a47e3b] text-[#a47e3b] hover:bg-[#a47e3b] hover:text-white"
                >
                  XP Bonuslar
                </Button>
                <Button
                  onClick={() => setIsXpModalOpen(true)}
                  className="bg-transparent border border-[#a47e3b] text-[#a47e3b] hover:bg-[#a47e3b] hover:text-white"
                >
                  XP Table
                </Button>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Search recipes..."
                    className="pl-10 bg-[#0f111a] border-[#2a2d3a] focus:border-[#a47e3b] focus:ring-[#a47e3b]"
                  />
                </div>
              </div>
            </div>

            {/* Leveling Calculator */}
            <Calculator 
              profession={selectedProfession}
              selectedRecipe={selectedRecipeForCalc}
              prices={prices}
              onSetPricesClick={() => setIsPriceModalOpen(true)}
              xpBonuses={xpBonuses}
            />

            {/* Efficiency Calculator */}
            <EfficiencyCalculator
              profession={selectedProfession}
              prices={prices}
              xpBonuses={xpBonuses}
            />

            {/* Recipe Tabs */}
            <Tabs defaultValue="learned" className="mt-6">
              <TabsList className="bg-transparent p-0 border-b border-[#2a2d3a] rounded-none">
                <TabsTrigger value="learned" className="data-[state=active]:bg-transparent data-[state=active]:text-[#a47e3b] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#a47e3b] rounded-none">
                  LEARNED
                </TabsTrigger>
                <TabsTrigger value="unlearned" className="data-[state=active]:bg-transparent data-[state=active]:text-[#a47e3b] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#a47e3b] rounded-none">
                  UNLEARNED
                </TabsTrigger>
              </TabsList>
              <TabsContent value="learned" className="mt-6">
                <div className="space-y-4">
                  {learnedRecipes.length > 0 ? (
                    learnedRecipes.map((recipe) => (
                      <RecipeCard 
                        key={recipe.id} 
                        recipe={recipe} 
                        playerLevel={selectedProfession.level}
                        onSelectForCalc={handleSelectRecipeForCalc}
                        isSelectedForCalc={selectedRecipeForCalc?.id === recipe.id}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p>No learned recipes for {selectedProfession.name} yet.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="unlearned" className="mt-6">
                 <div className="space-y-4">
                  {unlearnedRecipes.length > 0 ? (
                    unlearnedRecipes.map((recipe) => (
                      <RecipeCard 
                        key={recipe.id} 
                        recipe={recipe} 
                        playerLevel={selectedProfession.level}
                        onSelectForCalc={handleSelectRecipeForCalc}
                        isSelectedForCalc={selectedRecipeForCalc?.id === recipe.id}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p>All available recipes have been learned.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editingProfession !== null} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
        <DialogContent className="bg-[#1a1c25] border-[#2a2d3a] text-gray-200">
          <DialogHeader>
            <DialogTitle className="text-white">Edit {editingProfession?.name}</DialogTitle>
            <DialogDescription>
              Set the level and experience for this profession.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="level" className="text-right text-gray-400">
                Level
              </Label>
              <Input
                id="level"
                name="level"
                type="number"
                value={editingProfession?.level || ''}
                onChange={handleFormChange}
                className="col-span-3 bg-[#0f111a] border-[#2a2d3a] focus:border-[#a47e3b] focus:ring-[#a47e3b]"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currentXp" className="text-right text-gray-400">
                Current XP
              </Label>
              <Input
                id="currentXp"
                name="currentXp"
                type="number"
                value={editingProfession?.currentXp || ''}
                onChange={handleFormChange}
                className="col-span-3 bg-[#0f111a] border-[#2a2d3a] focus:border-[#a47e3b] focus:ring-[#a47e3b]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSave} className="bg-[#a47e3b] text-white hover:bg-[#b8914a]">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* XP Table Modal */}
      <XpTableModal isOpen={isXpModalOpen} onClose={() => setIsXpModalOpen(false)} />

      {/* Price Modal */}
      <PriceModal 
        isOpen={isPriceModalOpen}
        onClose={() => setIsPriceModalOpen(false)}
        recipes={selectedProfession.recipes}
        initialPrices={prices}
        onSave={handleSavePrices}
      />

      {/* XP Bonus Modal */}
      <XpBonusModal
        isOpen={isXpBonusModalOpen}
        onClose={() => setIsXpBonusModalOpen(false)}
        initialBonuses={xpBonuses}
        onSave={handleSaveBonuses}
      />
    </>
  );
}
