import { TestBed } from '@angular/core/testing';
import * as firestoreModule from 'firebase/firestore';
import { GroceryService } from './grocery.service';
import { GroceryItem, GroceryItemPayload } from '../models/grocery-item.model';

const mockPayload: GroceryItemPayload = {
  userId: 'u1',
  name: 'Milk',
  amount: '2L',
  price: 48,
  currency: 'UAH',
  bought: false,
};

const mockItem: GroceryItem = { id: 'doc1', ...mockPayload };

function makeSnap(items: GroceryItem[]) {
  return {
    docs: items.map((item) => ({
      id: item.id,
      data: () => {
        const { id, ...rest } = item;
        return rest;
      },
    })),
  } as unknown as Awaited<ReturnType<typeof firestoreModule.getDocs>>;
}

function makeDocSnap(item: GroceryItem) {
  return {
    id: item.id,
    data: () => {
      const { id, ...rest } = item;
      return rest;
    },
  } as unknown as Awaited<ReturnType<typeof firestoreModule.getDoc>>;
}

describe('GroceryService', () => {
  let service: GroceryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GroceryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getItems', () => {
    it('should return items filtered by userId', (done) => {
      spyOn(firestoreModule, 'getDocs').and.returnValue(Promise.resolve(makeSnap([mockItem])));

      service.getItems('u1').subscribe((items) => {
        expect(items).toEqual([mockItem]);
        done();
      });
    });

    it('should return an empty array when no items exist', (done) => {
      spyOn(firestoreModule, 'getDocs').and.returnValue(Promise.resolve(makeSnap([])));

      service.getItems('u1').subscribe((items) => {
        expect(items).toEqual([]);
        done();
      });
    });
  });

  describe('addItem', () => {
    it('should add a document and return the item with its new id', (done) => {
      spyOn(firestoreModule, 'addDoc').and.returnValue(
        Promise.resolve({ id: 'newId' } as unknown as firestoreModule.DocumentReference),
      );

      service.addItem(mockPayload).subscribe((item) => {
        expect(item).toEqual({ id: 'newId', ...mockPayload });
        done();
      });
    });
  });

  describe('updateItem', () => {
    it('should update the document and return the refreshed item', (done) => {
      const updated: GroceryItem = { ...mockItem, bought: true };
      spyOn(firestoreModule, 'updateDoc').and.returnValue(Promise.resolve());
      spyOn(firestoreModule, 'getDoc').and.returnValue(Promise.resolve(makeDocSnap(updated)));

      service.updateItem('doc1', { bought: true }).subscribe((item) => {
        expect(item.bought).toBeTrue();
        done();
      });
    });
  });

  describe('deleteItem', () => {
    it('should delete the document', (done) => {
      spyOn(firestoreModule, 'deleteDoc').and.returnValue(Promise.resolve());

      service.deleteItem('doc1').subscribe(() => {
        expect(firestoreModule.deleteDoc).toHaveBeenCalled();
        done();
      });
    });
  });
});
