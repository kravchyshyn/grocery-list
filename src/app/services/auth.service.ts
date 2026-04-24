import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { User as FirebaseUser } from 'firebase/auth';
import { FirebaseAuthApi } from './firebase-auth-api.service';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private authApi = inject(FirebaseAuthApi);
  private readonly STORAGE_KEY = 'grocery_auth_user';

  currentUser = signal<User | null>(this.restoreUser());

  constructor() {
    this.authApi.onAuthStateChanged((fbUser) => {
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
    return from(this.authApi.signInWithEmailAndPassword(email, password)).pipe(
      map((cred) => this.mapUser(cred.user)),
      tap((user) => this.currentUser.set(user)),
      catchError(() => throwError(() => new Error('Invalid email or password.'))),
    );
  }

  register(name: string, email: string, password: string): Observable<User> {
    return from(
      this.authApi.createUserWithEmailAndPassword(email, password).then((cred) =>
        this.authApi.updateProfile(cred.user, { displayName: name }).then(() => cred.user),
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
    this.authApi.signInAnonymously().then((cred) => {
      this.currentUser.set(this.mapUser(cred.user));
      this.router.navigate(['/']);
    });
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
    this.authApi.signOut().then(() => this.router.navigate(['/login']));
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
