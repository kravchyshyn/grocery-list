import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GroceryItemComponent } from './grocery-item.component';
import { GroceryItem } from '../../models/grocery-item.model';

const baseItem: GroceryItem = {
  id: '1',
  userId: 'u1',
  name: 'Milk',
  amount: '2L',
  price: 48,
  currency: 'UAH',
  bought: false,
};

describe('GroceryItemComponent', () => {
  let component: GroceryItemComponent;
  let fixture: ComponentFixture<GroceryItemComponent>;
  let el: HTMLElement;

  function setItem(item: GroceryItem) {
    fixture.componentRef.setInput('item', item);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroceryItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GroceryItemComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    setItem(baseItem);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Rendering ──────────────────────────────────────────────

  it('should display the item name', () => {
    expect(el.querySelector('.item-name')?.textContent).toContain('Milk');
  });

  it('should display the amount chip', () => {
    expect(el.querySelector('.chip--amount')?.textContent).toContain('2L');
  });

  it('should display a formatted price chip for UAH', () => {
    expect(el.querySelector('.chip--price')?.textContent).toContain('₴48.00');
  });

  it('should display a formatted price chip for USD', () => {
    setItem({ ...baseItem, price: 9.99, currency: 'USD' });
    expect(el.querySelector('.chip--price')?.textContent).toContain('$9.99');
  });

  it('should display a formatted price chip for EUR', () => {
    setItem({ ...baseItem, price: 5, currency: 'EUR' });
    expect(el.querySelector('.chip--price')?.textContent).toContain('€5.00');
  });

  it('should not render the price chip when price is null', () => {
    setItem({ ...baseItem, price: null });
    expect(el.querySelector('.chip--price')).toBeNull();
  });

  it('should not render the amount chip when amount is empty', () => {
    setItem({ ...baseItem, amount: '' });
    expect(el.querySelector('.chip--amount')).toBeNull();
  });

  // ── Bought state ────────────────────────────────────────────

  it('should not apply bought class when item is not bought', () => {
    expect(el.querySelector('.item--bought')).toBeNull();
  });

  it('should apply the bought class when item is bought', () => {
    setItem({ ...baseItem, bought: true });
    expect(el.querySelector('.item--bought')).toBeTruthy();
  });

  it('should check the checkbox when item is bought', () => {
    setItem({ ...baseItem, bought: true });
    const checkbox = el.querySelector<HTMLInputElement>('input[type="checkbox"]');
    expect(checkbox?.checked).toBeTrue();
  });

  // ── Output events ───────────────────────────────────────────

  it('should emit toggled with the item when checkbox changes', () => {
    const spy = spyOn(component.toggled, 'emit');
    el.querySelector<HTMLInputElement>('input[type="checkbox"]')!.dispatchEvent(
      new Event('change'),
    );
    expect(spy).toHaveBeenCalledWith(baseItem);
  });

  it('should emit editRequested with the item on edit button click', () => {
    const spy = spyOn(component.editRequested, 'emit');
    el.querySelector<HTMLButtonElement>('.icon-btn--edit')!.click();
    expect(spy).toHaveBeenCalledWith(baseItem);
  });

  it('should emit deleteRequested with the item id on delete button click', () => {
    const spy = spyOn(component.deleteRequested, 'emit');
    el.querySelector<HTMLButtonElement>('.icon-btn--delete')!.click();
    expect(spy).toHaveBeenCalledWith('1');
  });

  // ── Computed price formatting ───────────────────────────────

  it('should return null formattedPrice when price is null', () => {
    setItem({ ...baseItem, price: null });
    expect(component.formattedPrice()).toBeNull();
  });

  it('should return correctly formatted price string', () => {
    expect(component.formattedPrice()).toBe('₴48.00');
  });
});
