import { Injectable } from '@angular/core';
import * as fs from 'firebase/firestore';
import { firebaseDb } from '../firebase';

/** Thin injectable wrapper around firebase/firestore module-level functions.
 *  Exists solely to make GroceryService unit-testable (module-level ESM
 *  exports are non-writable and cannot be spied on directly). */
@Injectable({ providedIn: 'root' })
export class FirebaseFirestoreApi {
  collection(path: string) {
    return fs.collection(firebaseDb, path);
  }

  query(col: fs.CollectionReference, ...constraints: fs.QueryConstraint[]) {
    return fs.query(col, ...constraints);
  }

  where(field: string, op: fs.WhereFilterOp, value: unknown) {
    return fs.where(field, op, value);
  }

  doc(path: string, id: string) {
    return fs.doc(firebaseDb, path, id);
  }

  getDocs(q: fs.Query) {
    return fs.getDocs(q);
  }

  addDoc(col: fs.CollectionReference, data: fs.WithFieldValue<fs.DocumentData>) {
    return fs.addDoc(col, data);
  }

  updateDoc(ref: fs.DocumentReference, data: fs.UpdateData<fs.DocumentData>) {
    return fs.updateDoc(ref, data);
  }

  getDoc(ref: fs.DocumentReference) {
    return fs.getDoc(ref);
  }

  deleteDoc(ref: fs.DocumentReference) {
    return fs.deleteDoc(ref);
  }
}
