import { Component, input, output } from '@angular/core';
import { GroceryItem } from '../../models/grocery-item.model';

@Component({
  selector: 'app-grocery-item',
  templateUrl: './grocery-item.component.html',
  styleUrl: './grocery-item.component.scss'
})
export class GroceryItemComponent {
  item = input.required<GroceryItem>();
  toggled = output<GroceryItem>();
  editRequested = output<GroceryItem>();
  deleteRequested = output<number>();

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
