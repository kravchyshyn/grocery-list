export type Currency = 'UAH' | 'USD' | 'EUR';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  UAH: '₴',
  USD: '$',
  EUR: '€',
};

export interface GroceryItem {
  id: string | number;
  name: string;
  amount: string;
  price: number | null;
  currency: Currency;
  bought: boolean;
}

export type GroceryItemPayload = Omit<GroceryItem, 'id'>;
