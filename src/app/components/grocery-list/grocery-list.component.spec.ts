import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { GroceryListComponent } from './grocery-list.component';
import { GroceryService } from '../../services/grocery.service';
import { AuthService } from '../../services/auth.service';
import { GroceryItem, ItemFormPayload } from '../../models/grocery-item.model';
import { User } from '../../models/user.model';

const mockUser: User = { id: 'u1', name: 'Alice', email: 'a@test.com', isAnonymous: false };
const mockGuestUser: User = { id: 'guest-uid', name: 'Guest', email: null, isAnonymous: true };

const makeItems = (n: number): GroceryItem[] =>
  Array.from({ length: n }, (_, i) => ({
    id: String(i + 1),
    userId: 'u1',
    name: `Item ${i + 1}`,
    amount: '',
    price: null,
    currency: 'UAH' as const,
    bought: i % 2 === 0,
  }));

const twoItems = makeItems(2);

function createAuthMock(user: User | null = mockUser, guest = false) {
  return {
    currentUser: signal<User | null>(user),
    isGuest: jasmine.createSpy('isGuest').and.returnValue(guest),
    logout: jasmine.createSpy('logout'),
  };
}

describe('GroceryListComponent', () => {
  let component: GroceryListComponent;
  let fixture: ComponentFixture<GroceryListComponent>;
  let grocerySpy: jasmine.SpyObj<GroceryService>;
  let authMock: ReturnType<typeof createAuthMock>;

  beforeEach(async () => {
    grocerySpy = jasmine.createSpyObj('GroceryService', [
      'getItems',
      'addItem',
      'updateItem',
      'deleteItem',
    ]);
    grocerySpy.getItems.and.returnValue(of(twoItems));
    authMock = createAuthMock();

    await TestBed.configureTestingModule({
      imports: [GroceryListComponent],
      providers: [
        provideRouter([]),
        { provide: GroceryService, useValue: grocerySpy },
        { provide: AuthService, useValue: authMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GroceryListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  // ── Initialisation ──────────────────────────────────────────

  it('should call getItems with the current user id on init', () => {
    expect(grocerySpy.getItems).toHaveBeenCalledWith('u1');
  });

  it('should populate items after loading', () => {
    expect(component.items()).toEqual(twoItems);
  });

  it('should set an error message when loadItems fails', () => {
    grocerySpy.getItems.and.returnValue(throwError(() => new Error('fail')));
    component.loadItems();
    expect(component.error()).toBe('Could not load items. Is the API server running?');
    expect(component.isLoading()).toBeFalse();
  });

  // ── Computed values ─────────────────────────────────────────

  it('totalCount should equal the number of items', () => {
    expect(component.totalCount()).toBe(2);
  });

  it('boughtCount should count only bought items', () => {
    // twoItems: index 0 → bought, index 1 → not bought
    expect(component.boughtCount()).toBe(1);
  });

  // ── Form state ──────────────────────────────────────────────

  it('should open the add form and clear editingItem', () => {
    component.openAddForm();
    expect(component.formMode()).toBe('add');
    expect(component.editingItem()).toBeNull();
  });

  it('should open the edit form with the selected item', () => {
    component.openEditForm(twoItems[0]);
    expect(component.formMode()).toBe('edit');
    expect(component.editingItem()).toEqual(twoItems[0]);
  });

  it('should close the form and clear editingItem', () => {
    component.openEditForm(twoItems[0]);
    component.closeForm();
    expect(component.formMode()).toBeNull();
    expect(component.editingItem()).toBeNull();
  });

  // ── saveItem ────────────────────────────────────────────────

  it('should add a new item and prepend it to the list', () => {
    const newItem: GroceryItem = { ...twoItems[0], id: '99', name: 'Butter' };
    grocerySpy.addItem.and.returnValue(of(newItem));

    component.openAddForm();
    const payload: ItemFormPayload = {
      name: 'Butter',
      amount: '',
      price: null,
      currency: 'UAH',
      bought: false,
    };
    component.saveItem(payload);

    expect(grocerySpy.addItem).toHaveBeenCalledWith({ ...payload, userId: 'u1' });
    expect(component.items()).toContain(newItem);
    expect(component.formMode()).toBeNull();
  });

  it('should update an existing item in the list', () => {
    const updated: GroceryItem = { ...twoItems[0], name: 'Skimmed Milk' };
    grocerySpy.updateItem.and.returnValue(of(updated));

    component.openEditForm(twoItems[0]);
    const payload: ItemFormPayload = {
      name: 'Skimmed Milk',
      amount: '2L',
      price: null,
      currency: 'UAH',
      bought: false,
    };
    component.saveItem(payload);

    const found = component.items().find((i) => i.id === twoItems[0].id);
    expect(found?.name).toBe('Skimmed Milk');
    expect(component.formMode()).toBeNull();
  });

  it('should set an error when addItem fails', () => {
    grocerySpy.addItem.and.returnValue(throwError(() => new Error('fail')));
    component.openAddForm();
    component.saveItem({ name: 'X', amount: '', price: null, currency: 'UAH', bought: false });
    expect(component.error()).toBe('Failed to add item.');
  });

  // ── toggleBought ────────────────────────────────────────────

  it('should call updateItem with the toggled bought value', () => {
    const toggled: GroceryItem = { ...twoItems[0], bought: !twoItems[0].bought };
    grocerySpy.updateItem.and.returnValue(of(toggled));

    component.toggleBought(twoItems[0]);

    expect(grocerySpy.updateItem).toHaveBeenCalledWith(twoItems[0].id, {
      bought: !twoItems[0].bought,
    });
    expect(component.items()[0].bought).toBe(toggled.bought);
  });

  // ── deleteItem ──────────────────────────────────────────────

  it('should remove the item from the list after deletion', () => {
    grocerySpy.deleteItem.and.returnValue(of(undefined));
    component.deleteItem(twoItems[0].id);
    expect(component.items().every((i) => i.id !== twoItems[0].id)).toBeTrue();
  });

  it('should close the form when the edited item is deleted', () => {
    grocerySpy.deleteItem.and.returnValue(of(undefined));
    component.openEditForm(twoItems[0]);
    component.deleteItem(twoItems[0].id);
    expect(component.formMode()).toBeNull();
  });

  it('should set an error when deleteItem fails', () => {
    grocerySpy.deleteItem.and.returnValue(throwError(() => new Error('fail')));
    component.deleteItem('1');
    expect(component.error()).toBe('Failed to delete item.');
  });

  // ── Pagination ──────────────────────────────────────────────

  it('totalPages should be 1 for two items', () => {
    expect(component.totalPages()).toBe(1);
  });

  it('pagedItems should contain all items when count is below the page size', () => {
    expect(component.pagedItems().length).toBe(2);
  });

  it('should show 10 items on page 1 when there are 25 items', () => {
    component.items.set(makeItems(25));
    expect(component.totalPages()).toBe(3);
    expect(component.pagedItems().length).toBe(10);
  });

  it('should show remaining 5 items on the last page', () => {
    component.items.set(makeItems(25));
    component.nextPage();
    component.nextPage();
    expect(component.currentPage()).toBe(3);
    expect(component.pagedItems().length).toBe(5);
  });

  it('prevPage should not go below page 1', () => {
    component.prevPage();
    expect(component.currentPage()).toBe(1);
  });

  it('nextPage should not exceed the last page', () => {
    component.items.set(makeItems(25));
    component.nextPage();
    component.nextPage(); // already on last page
    expect(component.currentPage()).toBe(3);
  });

  it('should clamp to last page when deleting reduces total pages', () => {
    grocerySpy.deleteItem.and.returnValue(of(undefined));
    component.items.set(makeItems(11));
    component.nextPage(); // page 2 (1 item)
    component.deleteItem('11'); // removes the only item on page 2
    expect(component.currentPage()).toBe(1);
  });

  // ── Guest mode ──────────────────────────────────────────────

  it('isGuest should reflect the auth service', () => {
    expect(component.isGuest()).toBeFalse();
  });

  it('should call auth.logout on logout()', () => {
    component.logout();
    expect(authMock.logout).toHaveBeenCalled();
  });
});

describe('GroceryListComponent — guest mode', () => {
  let component: GroceryListComponent;
  let fixture: ComponentFixture<GroceryListComponent>;
  let grocerySpy: jasmine.SpyObj<GroceryService>;

  beforeEach(async () => {
    grocerySpy = jasmine.createSpyObj('GroceryService', [
      'getItems',
      'addItem',
      'updateItem',
      'deleteItem',
    ]);
    grocerySpy.getItems.and.returnValue(of([]));
    const authMock = createAuthMock(mockGuestUser, true);

    await TestBed.configureTestingModule({
      imports: [GroceryListComponent],
      providers: [
        provideRouter([]),
        { provide: GroceryService, useValue: grocerySpy },
        { provide: AuthService, useValue: authMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GroceryListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load items using the guest user id', () => {
    expect(grocerySpy.getItems).toHaveBeenCalledWith('guest');
  });

  it('isGuest should be true', () => {
    expect(component.isGuest()).toBeTrue();
  });
});
