import { Component, computed, input, output } from '@angular/core';
import { CURRENCY_SYMBOLS, GroceryItem } from '../../models/grocery-item.model';

@Component({
  selector: 'app-grocery-item',
  templateUrl: './grocery-item.component.html',
  styleUrl: './grocery-item.component.scss',
})
export class GroceryItemComponent {
  item = input.required<GroceryItem>();
  toggled = output<GroceryItem>();
  editRequested = output<GroceryItem>();
  deleteRequested = output<string | number>();

  formattedPrice = computed(() => {
    const { price, currency } = this.item();
    if (price == null) return null;
    const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
    return `${symbol}${price.toFixed(2)}`;
  });

  toggle() {
    this.toggled.emit(this.item());
  }

  edit() {
    this.editRequested.emit(this.item());
  }

  delete() {
    this.deleteRequested.emit(this.item().id);
  }
}
