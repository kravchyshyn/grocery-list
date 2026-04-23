import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, switchMap, tap } from 'rxjs';
import { GUEST_USER, User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'http://localhost:3000/users';
  private readonly STORAGE_KEY = 'grocery_auth_user';

  currentUser = signal<User | null>(this.restoreUser());

  private restoreUser(): User | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  isGuest(): boolean {
    return this.currentUser()?.id === GUEST_USER.id;
  }

  login(email: string, password: string) {
    return this.http
      .get<User[]>(`${this.apiUrl}?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`)
      .pipe(
        map((users) => {
          if (!users.length) throw new Error('Invalid email or password.');
          return users[0];
        }),
        tap((user) => this.setUser(user))
      );
  }

  register(name: string, email: string, password: string) {
    return this.http
      .get<User[]>(`${this.apiUrl}?email=${encodeURIComponent(email)}`)
      .pipe(
        switchMap((existing) => {
          if (existing.length) throw new Error('An account with this email already exists.');
          return this.http.post<User>(this.apiUrl, { name, email, password });
        }),
        tap((user) => this.setUser(user))
      );
  }

  loginAsGuest(): void {
    this.setUser(GUEST_USER);
    this.router.navigate(['/']);
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
    this.router.navigate(['/login']);
  }

  private setUser(user: User): void {
    this.currentUser.set(user);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  }
}
