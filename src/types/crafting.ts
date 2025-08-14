import { LucideIcon } from "lucide-react";

export interface Material {
  name: string;
  quantity: number;
}

export interface Recipe {
  id: string;
  name: string;
  outputItemName: string;
  description: string;
  requiredLevel: number;
  xp: number;
  materials: Material[];
  img: string;
  outputQuantity: number;
}

export interface Profession {
  id: string;
  name: string;
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  recipes: Recipe[];
  Icon: LucideIcon;
  requiredProfession?: string;
}

export interface Prices {
  [itemName:string]: number;
}

export interface XpTableRow {
  level: number;
  xp: number;
}

export type PremiumType = 'none' | 'craft' | 'farm' | 'exp';

export interface XpBonuses {
  gathererTitle: boolean;
  premium: PremiumType;
  eggStuffedPeppers: boolean;
  serverExpEvent: boolean;
  kingExpEvent: boolean;
}

// Types for the new Efficiency Calculator
export interface CraftingStep {
  recipeName: string;
  crafts: number;
  xpGained: number;
  inputMaterial: { name: string; quantity: number };
  outputMaterial: { name: string; quantity: number };
  blockTitle?: string;
}

export interface OptimalPath {
  totalXp: number;
  totalCost: number;
  startingMaterial: { name: string; quantity: number };
  steps: CraftingStep[];
  pathTitle: string;
  finalProducts: { name: string; quantity: number }[];
  finalProductValue: number;
  netCost: number;
}

export interface CalculationPath extends OptimalPath {
  isLevelingPath?: boolean;
  baseMaterials?: { name: string; quantity: number }[];
}
