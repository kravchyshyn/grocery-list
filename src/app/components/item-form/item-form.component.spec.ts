import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ItemFormComponent } from './item-form.component';
import { GroceryItem, ItemFormPayload } from '../../models/grocery-item.model';

const existingItem: GroceryItem = {
  id: '1',
  userId: 'u1',
  name: 'Milk',
  amount: '2L',
  price: 48,
  currency: 'UAH',
  bought: false,
};

describe('ItemFormComponent', () => {
  let component: ItemFormComponent;
  let fixture: ComponentFixture<ItemFormComponent>;
  let el: HTMLElement;

  async function create(editItem: GroceryItem | null = null) {
    await TestBed.configureTestingModule({
      imports: [ItemFormComponent, ReactiveFormsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(ItemFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('editItem', editItem);
    fixture.detectChanges();
    el = fixture.nativeElement;
  }

  describe('Add mode (editItem = null)', () => {
    beforeEach(async () => create());

    it('should create', () => expect(component).toBeTruthy());

    it('should show "Add Item" as the form title', () => {
      expect(el.querySelector('.form-title')?.textContent).toContain('Add Item');
    });

    it('should initialise with empty name, amount and null price', () => {
      expect(component.form.value.name).toBe('');
      expect(component.form.value.amount).toBe('');
      expect(component.form.value.price).toBeNull();
    });

    it('should default currency to UAH', () => {
      expect(component.form.value.currency).toBe('UAH');
    });

    it('should not emit saved and mark name touched when name is empty on submit', () => {
      const spy = spyOn(component.saved, 'emit');
      component.submit();
      expect(spy).not.toHaveBeenCalled();
      expect(component.form.controls['name'].touched).toBeTrue();
    });

    it('should emit saved with correct payload on valid submit', () => {
      let emitted: ItemFormPayload | undefined;
      component.saved.subscribe((p) => (emitted = p));

      component.form.patchValue({ name: 'Bread', amount: '1 loaf', price: 35, currency: 'EUR' });
      component.submit();

      expect(emitted).toEqual({
        name: 'Bread',
        amount: '1 loaf',
        price: 35,
        currency: 'EUR',
        bought: false,
      });
    });

    it('should treat empty price input as null in the payload', () => {
      let emitted: ItemFormPayload | undefined;
      component.saved.subscribe((p) => (emitted = p));
      component.form.patchValue({ name: 'Eggs', price: null });
      component.submit();
      expect(emitted?.price).toBeNull();
    });

    it('should emit cancelled when cancel() is called', () => {
      const spy = spyOn(component.cancelled, 'emit');
      component.cancel();
      expect(spy).toHaveBeenCalled();
    });

    it('nameInvalid should be false before the field is touched', () => {
      expect(component.nameInvalid).toBeFalse();
    });

    it('nameInvalid should be true after submitting with an empty name', () => {
      component.submit();
      expect(component.nameInvalid).toBeTrue();
    });
  });

  describe('Edit mode (editItem provided)', () => {
    beforeEach(async () => create(existingItem));

    it('should show "Edit Item" as the form title', () => {
      expect(el.querySelector('.form-title')?.textContent).toContain('Edit Item');
    });

    it('should pre-fill the form with the existing item values', () => {
      expect(component.form.value.name).toBe('Milk');
      expect(component.form.value.amount).toBe('2L');
      expect(component.form.value.price).toBe(48);
      expect(component.form.value.currency).toBe('UAH');
    });

    it('should preserve the bought flag from the existing item in the payload', () => {
      let emitted: ItemFormPayload | undefined;
      component.saved.subscribe((p) => (emitted = p));
      component.submit();
      expect(emitted?.bought).toBeFalse();
    });

    it('should emit updated values on submit', () => {
      let emitted: ItemFormPayload | undefined;
      component.saved.subscribe((p) => (emitted = p));
      component.form.patchValue({ name: 'Whole Milk', amount: '1L', price: 55, currency: 'USD' });
      component.submit();
      expect(emitted).toEqual({
        name: 'Whole Milk',
        amount: '1L',
        price: 55,
        currency: 'USD',
        bought: false,
      });
    });
  });

  describe('currency selector', () => {
    beforeEach(async () => create());

    it('should expose UAH, USD, EUR as options', () => {
      expect(component.currencies).toEqual(['UAH', 'USD', 'EUR']);
    });

    it('should render a select with three currency options', () => {
      const options = el.querySelectorAll('.currency-select option');
      expect(options.length).toBe(3);
    });
  });
});
