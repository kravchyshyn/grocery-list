import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { GroceryItem, GroceryItemPayload } from '../../models/grocery-item.model';
import { GroceryService } from '../../services/grocery.service';
import { GroceryItemComponent } from '../grocery-item/grocery-item.component';
import { ItemFormComponent } from '../item-form/item-form.component';

type FormMode = 'add' | 'edit' | null;

@Component({
  selector: 'app-grocery-list',
  imports: [GroceryItemComponent, ItemFormComponent],
  templateUrl: './grocery-list.component.html',
  styleUrl: './grocery-list.component.scss'
})
export class GroceryListComponent implements OnInit {
  private groceryService = inject(GroceryService);

  items = signal<GroceryItem[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  formMode = signal<FormMode>(null);
  editingItem = signal<GroceryItem | null>(null);

  ngOnInit() {
    this.loadItems();
  }

  loadItems() {
    this.isLoading.set(true);
    this.error.set(null);
    this.groceryService.getItems().subscribe({
      next: (items) => {
        this.items.set(items);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Could not load items. Is the API server running?');
        this.isLoading.set(false);
      }
    });
  }

  openAddForm() {
    this.editingItem.set(null);
    this.formMode.set('add');
  }

  openEditForm(item: GroceryItem) {
    this.editingItem.set(item);
    this.formMode.set('edit');
  }

  closeForm() {
    this.formMode.set(null);
    this.editingItem.set(null);
  }

  saveItem(payload: GroceryItemPayload) {
    const editing = this.editingItem();
    if (editing) {
      this.groceryService.updateItem(editing.id, payload).subscribe({
        next: (updated) => {
          this.items.update((list) =>
            list.map((i) => (i.id === updated.id ? updated : i))
          );
          this.closeForm();
        },
        error: () => this.error.set('Failed to update item.')
      });
    } else {
      this.groceryService.addItem(payload).subscribe({
        next: (created) => {
          this.items.update((list) => [...list, created]);
          this.closeForm();
        },
        error: () => this.error.set('Failed to add item.')
      });
    }
  }

  toggleBought(item: GroceryItem) {
    this.groceryService.updateItem(item.id, { bought: !item.bought }).subscribe({
      next: (updated) => {
        this.items.update((list) =>
          list.map((i) => (i.id === updated.id ? updated : i))
        );
      },
      error: () => this.error.set('Failed to update item.')
    });
  }

  deleteItem(id: string | number) {
    this.groceryService.deleteItem(id).subscribe({
      next: () => {
        this.items.update((list) => list.filter((i) => i.id !== id));
        if (this.editingItem()?.id === id) this.closeForm();
      },
      error: () => this.error.set('Failed to delete item.')
    });
  }

  boughtCount = computed(() => this.items().filter((i) => i.bought).length);
  totalCount = computed(() => this.items().length);
}
