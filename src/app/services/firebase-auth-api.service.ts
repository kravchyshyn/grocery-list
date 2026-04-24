import { Injectable } from '@angular/core';
import * as fa from 'firebase/auth';
import { firebaseAuth } from '../firebase';

/** Thin injectable wrapper around firebase/auth module-level functions.
 *  Exists solely to make AuthService unit-testable (module-level ESM
 *  exports are non-writable and cannot be spied on directly). */
@Injectable({ providedIn: 'root' })
export class FirebaseAuthApi {
  onAuthStateChanged(cb: fa.NextOrObserver<fa.User | null>): fa.Unsubscribe {
    return fa.onAuthStateChanged(firebaseAuth, cb);
  }

  signInWithEmailAndPassword(email: string, password: string) {
    return fa.signInWithEmailAndPassword(firebaseAuth, email, password);
  }

  createUserWithEmailAndPassword(email: string, password: string) {
    return fa.createUserWithEmailAndPassword(firebaseAuth, email, password);
  }

  updateProfile(user: fa.User, profile: { displayName?: string | null }) {
    return fa.updateProfile(user, profile);
  }

  signInAnonymously() {
    return fa.signInAnonymously(firebaseAuth);
  }

  signOut() {
    return fa.signOut(firebaseAuth);
  }
}
