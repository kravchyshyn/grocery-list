export interface GroceryItem {
  id: number;
  name: string;
  amount: string;
  bought: boolean;
}

export type GroceryItemPayload = Omit<GroceryItem, 'id'>;
