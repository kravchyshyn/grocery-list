import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GroceryService } from './grocery.service';
import { GroceryItem } from '../models/grocery-item.model';

describe('GroceryService', () => {
  let service: GroceryService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:3000/items';

  const mockItem: GroceryItem = {
    id: '1',
    userId: 'u1',
    name: 'Milk',
    amount: '2L',
    price: 48,
    currency: 'UAH',
    bought: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(GroceryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getItems', () => {
    it('should GET items filtered by userId', () => {
      let result: GroceryItem[] | undefined;
      service.getItems('u1').subscribe((items) => (result = items));

      const req = httpMock.expectOne(`${apiUrl}?userId=u1`);
      expect(req.request.method).toBe('GET');
      req.flush([mockItem]);

      expect(result).toEqual([mockItem]);
    });
  });

  describe('addItem', () => {
    it('should POST and return the created item', () => {
      const payload = {
        userId: 'u1',
        name: 'Bread',
        amount: '1 loaf',
        price: null,
        currency: 'UAH' as const,
        bought: false,
      };
      const created: GroceryItem = { id: '2', ...payload };
      let result: GroceryItem | undefined;

      service.addItem(payload).subscribe((item) => (result = item));

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(created);

      expect(result).toEqual(created);
    });
  });

  describe('updateItem', () => {
    it('should PATCH and return the updated item', () => {
      const updated: GroceryItem = { ...mockItem, bought: true };
      let result: GroceryItem | undefined;

      service.updateItem('1', { bought: true }).subscribe((item) => (result = item));

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ bought: true });
      req.flush(updated);

      expect(result).toEqual(updated);
    });

    it('should accept a numeric id in the URL', () => {
      service.updateItem(42, { bought: false }).subscribe();
      const req = httpMock.expectOne(`${apiUrl}/42`);
      expect(req.request.url).toContain('/42');
      req.flush(mockItem);
    });
  });

  describe('deleteItem', () => {
    it('should send DELETE request', () => {
      let completed = false;
      service.deleteItem('1').subscribe(() => (completed = true));

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);

      expect(completed).toBeTrue();
    });
  });
});
