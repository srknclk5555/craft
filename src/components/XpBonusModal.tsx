import { useState, useEffect } from "react";
import { XpBonuses } from "@/types/crafting";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface XpBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBonuses: XpBonuses;
  onSave: (bonuses: XpBonuses) => void;
}

export function XpBonusModal({ isOpen, onClose, initialBonuses, onSave }: XpBonusModalProps) {
  const [bonuses, setBonuses] = useState<XpBonuses>(initialBonuses);

  useEffect(() => {
    setBonuses(initialBonuses);
  }, [initialBonuses, isOpen]);

  const handleSave = () => {
    onSave(bonuses);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1c25] border-[#2a2d3a] text-gray-200">
        <DialogHeader>
          <DialogTitle className="text-white">Set XP Bonuses</DialogTitle>
          <DialogDescription>
            Select active XP bonuses to apply them to calculations.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-[#0f111a]">
            <Label htmlFor="gathererTitle" className="flex flex-col space-y-1 cursor-pointer">
              <span className="font-medium">Gatherer Title</span>
              <span className="font-normal text-gray-400 text-sm">+10% XP</span>
            </Label>
            <Switch
              id="gathererTitle"
              checked={bonuses.gathererTitle}
              onCheckedChange={(checked) => setBonuses(b => ({ ...b, gathererTitle: checked }))}
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-[#0f111a]">
            <Label htmlFor="eggStuffedPeppers" className="flex flex-col space-y-1 cursor-pointer">
              <span className="font-medium">Egg-Stuffed Peppers</span>
               <span className="font-normal text-gray-400 text-sm">+10% XP</span>
            </Label>
            <Switch
              id="eggStuffedPeppers"
              checked={bonuses.eggStuffedPeppers}
              onCheckedChange={(checked) => setBonuses(b => ({ ...b, eggStuffedPeppers: checked }))}
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-[#0f111a]">
            <Label htmlFor="serverExpEvent" className="flex flex-col space-y-1 cursor-pointer">
              <span className="font-medium">Server EXP Event</span>
               <span className="font-normal text-gray-400 text-sm">+10% XP</span>
            </Label>
            <Switch
              id="serverExpEvent"
              checked={bonuses.serverExpEvent}
              onCheckedChange={(checked) => setBonuses(b => ({ ...b, serverExpEvent: checked }))}
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-[#0f111a]">
            <Label htmlFor="kingExpEvent" className="flex flex-col space-y-1 cursor-pointer">
              <span className="font-medium">King's EXP Event</span>
               <span className="font-normal text-gray-400 text-sm">+10% XP</span>
            </Label>
            <Switch
              id="kingExpEvent"
              checked={bonuses.kingExpEvent}
              onCheckedChange={(checked) => setBonuses(b => ({ ...b, kingExpEvent: checked }))}
            />
          </div>
          <div className="p-3 rounded-lg hover:bg-[#0f111a]">
            <Label className="font-medium">Premium Bonus</Label>
            <RadioGroup
              value={bonuses.premium}
              onValueChange={(value) => setBonuses(b => ({ ...b, premium: value as XpBonuses['premium'] }))}
              className="mt-2 space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="p-none" />
                <Label htmlFor="p-none" className="cursor-pointer">None</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="craft" id="p-craft" />
                <Label htmlFor="p-craft" className="cursor-pointer">Crafting Premium (+30% XP)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="farm" id="p-farm" />
                <Label htmlFor="p-farm" className="cursor-pointer">Farming Premium (+10% XP)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="exp" id="p-exp" />
                <Label htmlFor="p-exp" className="cursor-pointer">EXP Premium (+10% XP)</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} className="bg-[#a47e3b] text-white hover:bg-[#b8914a]">Save Bonuses</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
