import { Component, computed, inject, OnInit, signal }      from '@angular/core';
import { Router } from '@angular/router';
import { GroceryItem, GroceryItemPayload, ItemFormPayload } from '../../models/grocery-item.model';
import { GroceryService } from '../../services/grocery.service';
import { AuthService } from '../../services/auth.service';
import { GroceryItemComponent } from '../grocery-item/grocery-item.component';
import { ItemFormComponent } from '../item-form/item-form.component';

type FormMode = 'add' | 'edit' | null;

const PAGE_SIZE = 20;

@Component({
  selector: 'app-grocery-list',
  imports: [GroceryItemComponent, ItemFormComponent],
  templateUrl: './grocery-list.component.html',
  styleUrl: './grocery-list.component.scss'
})
export class GroceryListComponent implements OnInit {
  private groceryService = inject(GroceryService);
  private auth = inject(AuthService);
  private router = inject(Router);

  currentUser = this.auth.currentUser;
  isGuest = computed(() => this.auth.isGuest());

  items = signal<GroceryItem[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  formMode = signal<FormMode>(null);
  editingItem = signal<GroceryItem | null>(null);

  // Pagination
  currentPage = signal(1);
  readonly pageSize = PAGE_SIZE;

  totalCount = computed(() => this.items().length);
  totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize));
  pagedItems = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.items().slice(start, start + this.pageSize);
  });
  boughtCount = computed(() => this.items().filter((i) => i.bought).length);

  ngOnInit() {
    this.loadItems();
  }

  loadItems() {
    this.isLoading.set(true);
    this.error.set(null);
    this.groceryService.getItems(this.currentUser()!.id).subscribe({
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

  saveItem(formPayload: ItemFormPayload) {
    const editing = this.editingItem();
    const payload: GroceryItemPayload = { ...formPayload, userId: this.currentUser()!.id };

    if (editing) {
      this.groceryService.updateItem(editing.id, payload).subscribe({
        next: (updated) => {
          this.items.update((list) => list.map((i) => (i.id === updated.id ? updated : i)));
          this.closeForm();
        },
        error: () => this.error.set('Failed to update item.')
      });
    } else {
      this.groceryService.addItem(payload).subscribe({
        next: (created) => {
          this.items.update((list) => [...list, created]);
          // Jump to last page so the new item is visible
          this.currentPage.set(this.totalPages());
          this.closeForm();
        },
        error: () => this.error.set('Failed to add item.')
      });
    }
  }

  toggleBought(item: GroceryItem) {
    this.groceryService.updateItem(item.id, { bought: !item.bought }).subscribe({
      next: (updated) => {
        this.items.update((list) => list.map((i) => (i.id === updated.id ? updated : i)));
      },
      error: () => this.error.set('Failed to update item.')
    });
  }

  deleteItem(id: string | number) {
    this.groceryService.deleteItem(id).subscribe({
      next: () => {
        this.items.update((list) => list.filter((i) => i.id !== id));
        if (this.editingItem()?.id === id) this.closeForm();
        // Clamp page if the last page is now empty
        if (this.currentPage() > this.totalPages()) {
          this.currentPage.set(Math.max(1, this.totalPages()));
        }
      },
      error: () => this.error.set('Failed to delete item.')
    });
  }

  prevPage() {
    this.currentPage.update((p) => Math.max(1, p - 1));
  }

  nextPage() {
    this.currentPage.update((p) => Math.min(this.totalPages(), p + 1));
  }

  signUp() {
    this.router.navigate(['/register']);
  }

  logout() {
    this.auth.logout();
  }
}
