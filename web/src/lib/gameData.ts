// Service pour charger les données de jeu (items, quêtes, etc.)
import itemsData from '@/data/items.json';
import questsData from '@/data/quests.json';

// Type pour les items
interface ItemData {
  id: string;
  name: string;
  type: string;
  rarity: string;
  description: string;
  price: number;
  emoji?: string;
  [key: string]: any;
}

// Type pour les quêtes
interface QuestData {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  type: string;
  objectives: Array<{
    id: string;
    type: string;
    description: string;
    target: string;
    required: number;
  }>;
  [key: string]: any;
}

// Créer un index plat de tous les items
const itemsIndex: Record<string, ItemData> = {};

// Parcourir toutes les catégories d'items
const itemCategories = itemsData as unknown as Record<string, unknown>;
for (const category of Object.keys(itemCategories)) {
  // Skip starterKits which has a different structure
  if (category === 'starterKits') continue;
  
  const items = itemCategories[category];
  if (typeof items === 'object' && items !== null) {
    for (const [itemId, item] of Object.entries(items as Record<string, unknown>)) {
      if (item && typeof item === 'object' && 'name' in item) {
        itemsIndex[itemId] = item as ItemData;
      }
    }
  }
}

// Index des quêtes
const questsIndex = questsData as Record<string, QuestData>;

/**
 * Récupère les données d'un item par son ID
 */
export function getItemById(itemId: string): ItemData | null {
  return itemsIndex[itemId] || null;
}

/**
 * Récupère le nom d'un item par son ID
 */
export function getItemName(itemId: string): string {
  const item = itemsIndex[itemId];
  return item?.name || itemId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Récupère la rareté d'un item par son ID
 */
export function getItemRarity(itemId: string): string {
  const item = itemsIndex[itemId];
  return item?.rarity || 'common';
}

/**
 * Récupère le type d'un item par son ID
 */
export function getItemType(itemId: string): string {
  const item = itemsIndex[itemId];
  return item?.type || 'misc';
}

/**
 * Récupère les données d'une quête par son ID
 */
export function getQuestById(questId: string): QuestData | null {
  return questsIndex[questId] || null;
}

/**
 * Récupère le titre d'une quête par son ID
 */
export function getQuestTitle(questId: string): string {
  const quest = questsIndex[questId];
  return quest?.title || questId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Récupère la description courte d'une quête par son ID
 */
export function getQuestDescription(questId: string): string {
  const quest = questsIndex[questId];
  return quest?.shortDescription || quest?.description || '';
}

/**
 * Récupère les objectifs d'une quête pour calculer la vraie progression
 */
export function getQuestObjectives(questId: string) {
  const quest = questsIndex[questId];
  return quest?.objectives || [];
}

/**
 * Calcule la progression d'une quête basée sur les objectifs
 */
export function calculateQuestProgress(questId: string, progress: Record<string, number>): number {
  const objectives = getQuestObjectives(questId);
  if (objectives.length === 0) return 0;

  let totalRequired = 0;
  let totalCompleted = 0;

  for (const obj of objectives) {
    const required = obj.required || 1;
    const current = progress[obj.id] || 0;
    totalRequired += required;
    totalCompleted += Math.min(current, required);
  }

  return totalRequired > 0 ? (totalCompleted / totalRequired) : 0;
}

// Export des index pour accès direct si nécessaire
export { itemsIndex, questsIndex };
