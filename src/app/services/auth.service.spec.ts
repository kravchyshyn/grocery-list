import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { GUEST_USER, User } from '../models/user.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;
  const apiUrl = 'http://localhost:3000/users';

  const mockUser: User = { id: 'u1', name: 'Alice', email: 'alice@test.com', password: 'secret' };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start unauthenticated when localStorage is empty', () => {
    expect(service.currentUser()).toBeNull();
    expect(service.isLoggedIn()).toBeFalse();
    expect(service.isGuest()).toBeFalse();
  });

  it('should restore user from localStorage on creation', () => {
    localStorage.setItem('grocery_auth_user', JSON.stringify(mockUser));
    // Re-create service to trigger restoration
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const freshService = TestBed.inject(AuthService);
    expect(freshService.currentUser()).toEqual(mockUser);
    expect(freshService.isLoggedIn()).toBeTrue();
  });

  describe('login', () => {
    it('should set currentUser and persist to localStorage on success', () => {
      service.login('alice@test.com', 'secret').subscribe();

      httpMock.expectOne(`${apiUrl}?email=alice%40test.com&password=secret`).flush([mockUser]);

      expect(service.currentUser()).toEqual(mockUser);
      expect(service.isLoggedIn()).toBeTrue();
      const stored = JSON.parse(localStorage.getItem('grocery_auth_user')!);
      expect(stored).toEqual(mockUser);
    });

    it('should throw with message when credentials are wrong', () => {
      let error: Error | undefined;
      service.login('alice@test.com', 'wrong').subscribe({ error: (e) => (error = e) });

      httpMock.expectOne((r) => r.url.includes('/users')).flush([]);

      expect(error?.message).toBe('Invalid email or password.');
      expect(service.currentUser()).toBeNull();
    });
  });

  describe('register', () => {
    it('should POST a new user and set currentUser', () => {
      service.register('Bob', 'bob@test.com', 'pass123').subscribe();

      // First call: check email uniqueness
      httpMock.expectOne(`${apiUrl}?email=bob%40test.com`).flush([]);
      // Second call: create user
      httpMock
        .expectOne(apiUrl)
        .flush({ id: 'u2', name: 'Bob', email: 'bob@test.com', password: 'pass123' });

      expect(service.currentUser()?.name).toBe('Bob');
    });

    it('should throw when email is already registered', () => {
      let error: Error | undefined;
      service.register('Alice2', 'alice@test.com', 'pass').subscribe({ error: (e) => (error = e) });

      httpMock.expectOne((r) => r.url.includes('email=')).flush([mockUser]);

      expect(error?.message).toBe('An account with this email already exists.');
      expect(service.currentUser()).toBeNull();
    });
  });

  describe('loginAsGuest', () => {
    it('should set the guest user', () => {
      service.loginAsGuest();
      expect(service.currentUser()).toEqual(GUEST_USER);
      expect(service.isGuest()).toBeTrue();
      expect(service.isLoggedIn()).toBeTrue();
    });

    it('should navigate to /', () => {
      const spy = spyOn(router, 'navigate');
      service.loginAsGuest();
      expect(spy).toHaveBeenCalledWith(['/']);
    });
  });

  describe('logout', () => {
    it('should clear currentUser and localStorage', () => {
      service.loginAsGuest();
      service.logout();
      expect(service.currentUser()).toBeNull();
      expect(service.isLoggedIn()).toBeFalse();
      expect(localStorage.getItem('grocery_auth_user')).toBeNull();
    });

    it('should navigate to /login', () => {
      const spy = spyOn(router, 'navigate');
      service.loginAsGuest();
      service.logout();
      expect(spy).toHaveBeenCalledWith(['/login']);
    });
  });
});
