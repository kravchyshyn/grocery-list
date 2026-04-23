import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import * as firebaseAuthModule from 'firebase/auth';
import { AuthService } from './auth.service';
import { User } from '../models/user.model';

const mockFbUser = (overrides: Partial<firebaseAuthModule.User> = {}) =>
  ({
    uid: 'u1',
    displayName: 'Alice',
    email: 'alice@test.com',
    isAnonymous: false,
    ...overrides,
  }) as firebaseAuthModule.User;

const mockUser: User = { id: 'u1', name: 'Alice', email: 'alice@test.com', isAnonymous: false };

describe('AuthService', () => {
  let service: AuthService;
  let router: Router;
  let onAuthChangedSpy: jasmine.Spy;

  beforeEach(() => {
    localStorage.clear();

    // Intercept onAuthStateChanged before the service constructor runs
    onAuthChangedSpy = spyOn(firebaseAuthModule, 'onAuthStateChanged').and.callFake(
      (_auth: firebaseAuthModule.Auth, cb: firebaseAuthModule.NextOrObserver<firebaseAuthModule.User | null>) => {
        if (typeof cb === 'function') cb(null);
        return () => {};
      },
    );

    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    service = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => localStorage.clear());

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
    TestBed.resetTestingModule();
    onAuthChangedSpy = spyOn(firebaseAuthModule, 'onAuthStateChanged').and.callFake(
      (_auth: any, cb: any) => { cb(null); return () => {}; },
    );
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fresh = TestBed.inject(AuthService);
    expect(fresh.currentUser()).toEqual(mockUser);
    expect(fresh.isLoggedIn()).toBeTrue();
  });

  describe('login', () => {
    it('should set currentUser on success', () => {
      spyOn(firebaseAuthModule, 'signInWithEmailAndPassword').and.returnValue(
        Promise.resolve({ user: mockFbUser() } as firebaseAuthModule.UserCredential),
      );

      let result: User | undefined;
      service.login('alice@test.com', 'secret').subscribe((u) => (result = u));

      // tick promises
      return Promise.resolve().then(() => {
        expect(service.currentUser()).toEqual(mockUser);
      });
    });

    it('should throw with message when credentials are wrong', (done) => {
      spyOn(firebaseAuthModule, 'signInWithEmailAndPassword').and.returnValue(
        Promise.reject({ code: 'auth/invalid-credential' }),
      );

      service.login('alice@test.com', 'wrong').subscribe({
        error: (e: Error) => {
          expect(e.message).toBe('Invalid email or password.');
          done();
        },
      });
    });
  });

  describe('register', () => {
    it('should create user and set currentUser', (done) => {
      const fbUser = mockFbUser({ displayName: 'Bob', email: 'bob@test.com', uid: 'u2' });
      spyOn(firebaseAuthModule, 'createUserWithEmailAndPassword').and.returnValue(
        Promise.resolve({ user: fbUser } as firebaseAuthModule.UserCredential),
      );
      spyOn(firebaseAuthModule, 'updateProfile').and.returnValue(Promise.resolve());

      service.register('Bob', 'bob@test.com', 'pass123').subscribe((u) => {
        expect(u.name).toBe('Bob');
        done();
      });
    });

    it('should throw when email is already registered', (done) => {
      spyOn(firebaseAuthModule, 'createUserWithEmailAndPassword').and.returnValue(
        Promise.reject({ code: 'auth/email-already-in-use' }),
      );

      service.register('Alice2', 'alice@test.com', 'pass').subscribe({
        error: (e: Error) => {
          expect(e.message).toBe('An account with this email already exists.');
          done();
        },
      });
    });
  });

  describe('loginAsGuest', () => {
    it('should set an anonymous user and navigate to /', (done) => {
      const guestFbUser = mockFbUser({ uid: 'anon1', displayName: null, email: null, isAnonymous: true });
      spyOn(firebaseAuthModule, 'signInAnonymously').and.returnValue(
        Promise.resolve({ user: guestFbUser } as firebaseAuthModule.UserCredential),
      );
      const navSpy = spyOn(router, 'navigate');

      service.loginAsGuest();

      Promise.resolve().then(() => {
        expect(service.isGuest()).toBeTrue();
        expect(navSpy).toHaveBeenCalledWith(['/']);
        done();
      });
    });
  });

  describe('logout', () => {
    it('should clear currentUser and navigate to /login', (done) => {
      spyOn(firebaseAuthModule, 'signOut').and.returnValue(Promise.resolve());
      const navSpy = spyOn(router, 'navigate');

      // Set a user first
      service['currentUser'].set(mockUser);
      service.logout();

      expect(service.currentUser()).toBeNull();
      Promise.resolve().then(() => {
        expect(navSpy).toHaveBeenCalledWith(['/login']);
        done();
      });
    });
  });

  describe('onAuthStateChanged integration', () => {
    it('should update currentUser when Firebase fires with a user', () => {
      let captured: firebaseAuthModule.NextOrObserver<firebaseAuthModule.User | null> | undefined;
      (firebaseAuthModule.onAuthStateChanged as jasmine.Spy).and.callFake(
        (_auth: any, cb: any) => { captured = cb; return () => {}; },
      );
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [provideRouter([])] });
      const svc = TestBed.inject(AuthService);

      if (typeof captured === 'function') captured(mockFbUser());
      expect(svc.currentUser()?.id).toBe('u1');
    });
  });
});
