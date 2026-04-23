export type Currency = 'UAH' | 'USD' | 'EUR';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  UAH: '₴',
  USD: '$',
  EUR: '€',
};

export interface GroceryItem {
  id: string;
  userId: string;
  name: string;
  amount: string;
  price: number | null;
  currency: Currency;
  bought: boolean;
}

/** Full payload sent to the API (no id) */
export type GroceryItemPayload = Omit<GroceryItem, 'id'>;

/** What the item form emits — no id or userId (list adds those) */
export type ItemFormPayload = Omit<GroceryItem, 'id' | 'userId'>;
