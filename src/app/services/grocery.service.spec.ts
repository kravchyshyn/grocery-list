import { TestBed } from '@angular/core/testing';
import { GroceryService } from './grocery.service';
import { FirebaseFirestoreApi } from './firebase-firestore-api.service';
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
  } as any;
}

function makeDocSnap(item: GroceryItem) {
  return {
    id: item.id,
    data: () => {
      const { id, ...rest } = item;
      return rest;
    },
  } as any;
}

describe('GroceryService', () => {
  let service: GroceryService;
  let db: jasmine.SpyObj<FirebaseFirestoreApi>;

  const fakeCol = {} as any;
  const fakeQuery = {} as any;
  const fakeRef = {} as any;

  beforeEach(() => {
    db = jasmine.createSpyObj<FirebaseFirestoreApi>('FirebaseFirestoreApi', [
      'collection',
      'query',
      'where',
      'doc',
      'getDocs',
      'addDoc',
      'updateDoc',
      'getDoc',
      'deleteDoc',
    ]);

    db.collection.and.returnValue(fakeCol);
    db.query.and.returnValue(fakeQuery);
    db.where.and.returnValue({} as any);
    db.doc.and.returnValue(fakeRef);

    TestBed.configureTestingModule({
      providers: [{ provide: FirebaseFirestoreApi, useValue: db }],
    });
    service = TestBed.inject(GroceryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getItems', () => {
    it('should return items filtered by userId', (done) => {
      db.getDocs.and.returnValue(Promise.resolve(makeSnap([mockItem])));

      service.getItems('u1').subscribe((items) => {
        expect(items).toEqual([mockItem]);
        done();
      });
    });

    it('should return an empty array when no items exist', (done) => {
      db.getDocs.and.returnValue(Promise.resolve(makeSnap([])));

      service.getItems('u1').subscribe((items) => {
        expect(items).toEqual([]);
        done();
      });
    });
  });

  describe('addItem', () => {
    it('should add a document and return the item with its new id', (done) => {
      db.addDoc.and.returnValue(Promise.resolve({ id: 'newId' } as any));

      service.addItem(mockPayload).subscribe((item) => {
        expect(item).toEqual({ id: 'newId', ...mockPayload });
        done();
      });
    });
  });

  describe('updateItem', () => {
    it('should update the document and return the refreshed item', (done) => {
      const updated: GroceryItem = { ...mockItem, bought: true };
      db.updateDoc.and.returnValue(Promise.resolve());
      db.getDoc.and.returnValue(Promise.resolve(makeDocSnap(updated)));

      service.updateItem('doc1', { bought: true }).subscribe((item) => {
        expect(item.bought).toBeTrue();
        done();
      });
    });
  });

  describe('deleteItem', () => {
    it('should delete the document', (done) => {
      db.deleteDoc.and.returnValue(Promise.resolve());

      service.deleteItem('doc1').subscribe(() => {
        expect(db.deleteDoc).toHaveBeenCalled();
        done();
      });
    });
  });
});
