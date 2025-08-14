import { useState, useMemo, useEffect } from "react";
import { Recipe, Prices } from "@/types/crafting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface PriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
  initialPrices: Prices;
  onSave: (prices: Prices) => void;
}

export function PriceModal({ isOpen, onClose, recipes, initialPrices, onSave }: PriceModalProps) {
  const [prices, setPrices] = useState<Prices>(initialPrices);

  useEffect(() => {
    setPrices(initialPrices);
  }, [initialPrices, isOpen]);

  const uniqueItems = useMemo(() => {
    const items = new Set<string>();
    recipes.forEach(recipe => {
      items.add(recipe.outputItemName);
      recipe.materials.forEach(mat => items.add(mat.name));
    });
    return Array.from(items).sort();
  }, [recipes]);

  const handlePriceChange = (item: string, value: string) => {
    setPrices(prev => ({
      ...prev,
      [item]: parseInt(value, 10) || 0,
    }));
  };

  const handleSave = () => {
    onSave(prices);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1c25] border-[#2a2d3a] text-gray-200 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Set Item Prices</DialogTitle>
          <DialogDescription>
            Enter the market price for each item to calculate costs and profits. Unpriced items will be treated as free.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-96 p-1">
          <div className="grid gap-4 py-4 pr-4">
            {uniqueItems.map(item => (
              <div key={item} className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor={item} className="text-right text-gray-400 truncate" title={item}>
                  {item}
                </Label>
                <Input
                  id={item}
                  type="number"
                  value={prices[item] || ''}
                  onChange={(e) => handlePriceChange(item, e.target.value)}
                  className="col-span-2 bg-[#0f111a] border-[#2a2d3a] focus:border-[#a47e3b] focus:ring-[#a47e3b]"
                  placeholder="Price per item"
                />
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} className="bg-[#a47e3b] text-white hover:bg-[#b8914a]">Save Prices</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
