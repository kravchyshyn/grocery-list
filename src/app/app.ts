import { Component } from '@angular/core';
import { GroceryListComponent } from './components/grocery-list/grocery-list.component';

@Component({
  selector: 'app-root',
  imports: [GroceryListComponent],
  template: `<app-grocery-list />`,
})
export class App {}
