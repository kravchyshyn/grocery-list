import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { debounceTime, filter, forkJoin } from 'rxjs';
import { RouterLink }                                  from '@angular/router';
import {
  Currency,
  CURRENCY_SYMBOLS,
  GroceryItem,
  GroceryItemPayload,
  ItemFormPayload,
} from '../../models/grocery-item.model';
import { GroceryService } from '../../services/grocery.service';
import { AuthService } from '../../services/auth.service';
import { GroceryItemComponent } from '../grocery-item/grocery-item.component';
import { ItemFormComponent }                                       from '../item-form/item-form.component';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

type FormMode = 'add' | 'edit' | null;
const PAGE_SIZE = 10;

const SEED_NAMES = [
  'Milk', 'Bread', 'Eggs', 'Butter', 'Cheese', 'Apples', 'Bananas', 'Chicken',
  'Rice', 'Pasta', 'Tomatoes', 'Onions', 'Garlic', 'Yogurt', 'Orange Juice',
  'Coffee', 'Tea', 'Sugar', 'Salt', 'Olive Oil',
];
const SEED_AMOUNTS = ['1L', '1 loaf', '12 pcs', '200g', '500g', '1 kg', '6 pcs', '', '2L', '1 pack'];
const SEED_CURRENCIES: Currency[] = ['UAH', 'UAH', 'UAH', 'USD', 'EUR'];

@Component({
  selector: 'app-grocery-list',
  imports: [GroceryItemComponent, ItemFormComponent, RouterLink, ReactiveFormsModule],
  templateUrl: './grocery-list.component.html',
  styleUrl: './grocery-list.component.scss',
})
export class GroceryListComponent implements OnInit {
  private groceryService = inject(GroceryService);
  private auth = inject(AuthService);

  isItemLoading = signal(false);
  currentUser = this.auth.currentUser;
  isGuest = computed(() => this.auth.isGuest());

  items = signal<GroceryItem[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  formMode = signal<FormMode>(null);
  editingItem = signal<GroceryItem | null>(null);

  currentPage = signal(1);
  totalCount = computed(() => this.items().length);
  totalPages = computed(() => Math.ceil(this.totalCount() / PAGE_SIZE));
  pagedItems = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.items().slice(start, start + PAGE_SIZE);
  });
  boughtCount = computed(() => this.items().filter((i) => i.bought).length);
  totals = computed(() => {
    const sums: Record<string, number> = {};
    for (const item of this.items()) {
      if (item.bought && item.price != null) {
        sums[item.currency] = (sums[item.currency] ?? 0) + item.price;
      }
    }
    return Object.entries(sums).map(([currency, sum]) => ({
      label: `${CURRENCY_SYMBOLS[currency as Currency]}${sum.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
    }));
  });

  form = new FormGroup({
    search: new FormControl('', [Validators.minLength(2)])
  });

  constructor() {
    this.form.controls.search.valueChanges
      .pipe(
        debounceTime(500))
      .subscribe((searchText) => {
        if (!searchText) {
          return;
        }

        this.groceryService.searchItems(this.auth.currentUser()?.id as string, searchText.trim() as string).subscribe((items) => {
          if (items.length > 0) {
            this.items.set(items);
            this.currentPage.set(1);
            this.error.set(null);
          } else {
            this.items.set([]);
            this.currentPage.set(1);
            this.error.set('No items found.');
          }
        })
      })
  }
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
      },
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
    this.isItemLoading.set(true);

    if (editing) {
      this.groceryService
        .updateItem(editing.id, payload)
        .pipe(debounceTime(500))
        .subscribe({
          next: (updated) => {
            this.items.update((list) => list.map((i) => (i.id === updated.id ? updated : i)));
            this.isItemLoading.set(false);
            this.closeForm();
          },
          error: () => {
            this.error.set('Failed to update item.');
            this.isItemLoading.set(false);
          },
        });
    } else {
      this.groceryService.addItem(payload).subscribe({
        next: (created) => {
          this.items.update((list) => [created, ...list]);
          this.currentPage.set(1);
          this.closeForm();
          this.isItemLoading.set(false);
        },
        error: () => {
          this.error.set('Failed to add item.');
          this.isItemLoading.set(false);
        },
      });
    }
  }

  toggleBought(item: GroceryItem) {
    this.groceryService.updateItem(item.id, { bought: !item.bought }).subscribe({
      next: (updated) =>
        this.items.update((list) => list.map((i) => (i.id === updated.id ? updated : i))),
      error: () => this.error.set('Failed to update item.'),
    });
  }

  deleteItem(id: string | number) {
    this.groceryService.deleteItem(id).subscribe({
      next: () => {
        this.items.update((list) => list.filter((i) => i.id !== id));
        if (this.editingItem()?.id === id) this.closeForm();
        if (this.currentPage() > this.totalPages()) {
          this.currentPage.set(Math.max(1, this.totalPages()));
        }
      },
      error: () => this.error.set('Failed to delete item.'),
    });
  }

  prevPage() {
    this.currentPage.update((p) => Math.max(1, p - 1));
  }

  nextPage() {
    this.currentPage.update((p) => Math.min(this.totalPages(), p + 1));
  }

  removeAllItems() {
    forkJoin(this.items().map((i) => this.groceryService.deleteItem(i.id))).subscribe({
      next: () => {
        this.items.set([]);
        this.currentPage.set(1);
        this.closeForm();
      },
      error: () => this.error.set('Failed to remove all items.'),
    });
  }

  generateTestItems() {
    const suffix = `#${Date.now().toString(36).slice(-4)}`;
    const payloads: GroceryItemPayload[] = SEED_NAMES.map((name, i) => ({
      userId: this.currentUser()!.id,
      name: `${name} ${suffix}`,
      amount: SEED_AMOUNTS[i % SEED_AMOUNTS.length],
      price: Math.round(Math.random() * 200 + 10),
      currency: SEED_CURRENCIES[i % SEED_CURRENCIES.length],
      bought: false,
    }));

    forkJoin(payloads.map((p) => this.groceryService.addItem(p))).subscribe({
      next: (created) => {
        this.items.update((list) => [...created.reverse(), ...list]);
        this.currentPage.set(1);
      },
      error: () => this.error.set('Failed to generate test items.'),
    });
  }

  logout() {
    this.auth.logout();
  }
}
