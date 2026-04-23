import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { firebaseDb } from '../firebase';
import { GroceryItem, GroceryItemPayload } from '../models/grocery-item.model';

@Injectable({ providedIn: 'root' })
export class GroceryService {
  private col = collection(firebaseDb, 'items');

  getItems(userId: string): Observable<GroceryItem[]> {
    const q = query(this.col, where('userId', '==', userId));
    return from(getDocs(q)).pipe(
      map((snap) => snap.docs.map((d) => ({ id: d.id, ...(d.data() as GroceryItemPayload) }))),
    );
  }

  addItem(payload: GroceryItemPayload): Observable<GroceryItem> {
    return from(addDoc(this.col, payload)).pipe(map((ref) => ({ id: ref.id, ...payload })));
  }

  updateItem(id: string, changes: Partial<GroceryItemPayload>): Observable<GroceryItem> {
    const ref = doc(firebaseDb, 'items', id);
    return from(updateDoc(ref, changes)).pipe(
      switchMap(() => from(getDoc(ref))),
      map((snap) => ({ id: snap.id, ...(snap.data() as GroceryItemPayload) })),
    );
  }

  deleteItem(id: string): Observable<void> {
    return from(deleteDoc(doc(firebaseDb, 'items', id)));
  }
}
