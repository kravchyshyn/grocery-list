import { inject, Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { FirebaseFirestoreApi } from './firebase-firestore-api.service';
import { GroceryItem, GroceryItemPayload } from '../models/grocery-item.model';

@Injectable({ providedIn: 'root' })
export class GroceryService {
  private db = inject(FirebaseFirestoreApi);
  private col = this.db.collection('items');

  getItems(userId: string): Observable<GroceryItem[]> {
    const q = this.db.query(this.col, this.db.where('userId', '==', userId));
    return from(this.db.getDocs(q)).pipe(
      map((snap) => snap.docs.map((d) => ({ id: d.id, ...(d.data() as GroceryItemPayload) }))),
    );
  }

  addItem(payload: GroceryItemPayload): Observable<GroceryItem> {
    return from(this.db.addDoc(this.col, payload)).pipe(map((ref) => ({ id: ref.id, ...payload })));
  }

  updateItem(id: string, changes: Partial<GroceryItemPayload>): Observable<GroceryItem> {
    const ref = this.db.doc('items', id);
    return from(this.db.updateDoc(ref, changes)).pipe(
      switchMap(() => from(this.db.getDoc(ref))),
      map((snap) => ({ id: snap.id, ...(snap.data() as GroceryItemPayload) })),
    );
  }

  deleteItem(id: string): Observable<void> {
    return from(this.db.deleteDoc(this.db.doc('items', id)));
  }
}
