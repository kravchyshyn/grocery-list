import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { from, Observable } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { firebaseAuth } from '../firebase';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private readonly STORAGE_KEY = 'grocery_auth_user';

  currentUser = signal<User | null>(this.restoreUser());

  constructor() {
    onAuthStateChanged(firebaseAuth, (fbUser) => {
      const user = fbUser ? this.mapUser(fbUser) : null;
      this.currentUser.set(user);
      if (user) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    });
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  isGuest(): boolean {
    return this.currentUser()?.isAnonymous === true;
  }

  login(email: string, password: string): Observable<User> {
    return from(signInWithEmailAndPassword(firebaseAuth, email, password)).pipe(
      map((cred) => this.mapUser(cred.user)),
      tap((user) => this.currentUser.set(user)),
      catchError(() => throwError(() => new Error('Invalid email or password.'))),
    );
  }

  register(name: string, email: string, password: string): Observable<User> {
    return from(
      createUserWithEmailAndPassword(firebaseAuth, email, password).then((cred) =>
        updateProfile(cred.user, { displayName: name }).then(() => cred.user),
      ),
    ).pipe(
      map((fbUser) => this.mapUser(fbUser)),
      tap((user) => this.currentUser.set(user)),
      catchError((err) =>
        throwError(
          () =>
            new Error(
              err.code === 'auth/email-already-in-use'
                ? 'An account with this email already exists.'
                : 'Registration failed. Please try again.',
            ),
        ),
      ),
    );
  }

  loginAsGuest(): void {
    signInAnonymously(firebaseAuth).then((cred) => {
      this.currentUser.set(this.mapUser(cred.user));
      this.router.navigate(['/']);
    });
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
    signOut(firebaseAuth).then(() => this.router.navigate(['/login']));
  }

  private mapUser(fbUser: FirebaseUser): User {
    return {
      id: fbUser.uid,
      name: fbUser.displayName ?? (fbUser.isAnonymous ? 'Guest' : (fbUser.email ?? '')),
      email: fbUser.email,
      isAnonymous: fbUser.isAnonymous,
    };
  }

  private restoreUser(): User | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? (JSON.parse(stored) as User) : null;
    } catch {
      return null;
    }
  }
}
