import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import * as firebaseAuthModule from 'firebase/auth';
import { AuthService } from './auth.service';
import { FirebaseAuthApi } from './firebase-auth-api.service';
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

function makeAuthApi(onAuthCb: (cb: (u: firebaseAuthModule.User | null) => void) => void) {
  const api = jasmine.createSpyObj<FirebaseAuthApi>('FirebaseAuthApi', [
    'onAuthStateChanged',
    'signInWithEmailAndPassword',
    'createUserWithEmailAndPassword',
    'updateProfile',
    'signInAnonymously',
    'signOut',
  ]);
  api.onAuthStateChanged.and.callFake((cb: any) => {
    onAuthCb(cb);
    return () => {};
  });
  return api;
}

describe('AuthService', () => {
  let service: AuthService;
  let router: Router;
  let authApi: jasmine.SpyObj<FirebaseAuthApi>;

  beforeEach(() => {
    localStorage.clear();
    authApi = makeAuthApi((cb) => cb(null));

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: FirebaseAuthApi, useValue: authApi }],
    });
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
    // Don't fire the callback — Firebase hasn't resolved yet, localStorage is the source of truth
    const freshApi = makeAuthApi((_cb) => {});
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: FirebaseAuthApi, useValue: freshApi }],
    });
    const fresh = TestBed.inject(AuthService);
    expect(fresh.currentUser()).toEqual(mockUser);
    expect(fresh.isLoggedIn()).toBeTrue();
  });

  describe('login', () => {
    it('should set currentUser on success', () => {
      authApi.signInWithEmailAndPassword.and.returnValue(
        Promise.resolve({ user: mockFbUser() } as firebaseAuthModule.UserCredential),
      );

      service.login('alice@test.com', 'secret').subscribe();

      return Promise.resolve().then(() => {
        expect(service.currentUser()).toEqual(mockUser);
      });
    });

    it('should throw with message when credentials are wrong', (done) => {
      authApi.signInWithEmailAndPassword.and.returnValue(
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
      authApi.createUserWithEmailAndPassword.and.returnValue(
        Promise.resolve({ user: fbUser } as firebaseAuthModule.UserCredential),
      );
      authApi.updateProfile.and.returnValue(Promise.resolve());

      service.register('Bob', 'bob@test.com', 'pass123').subscribe((u) => {
        expect(u.name).toBe('Bob');
        done();
      });
    });

    it('should throw when email is already registered', (done) => {
      authApi.createUserWithEmailAndPassword.and.returnValue(
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
      authApi.signInAnonymously.and.returnValue(
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
      authApi.signOut.and.returnValue(Promise.resolve());
      const navSpy = spyOn(router, 'navigate');

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
      let captured: ((u: firebaseAuthModule.User | null) => void) | undefined;
      TestBed.resetTestingModule();
      const captureApi = makeAuthApi((cb) => { captured = cb; });
      TestBed.configureTestingModule({
        providers: [provideRouter([]), { provide: FirebaseAuthApi, useValue: captureApi }],
      });
      const svc = TestBed.inject(AuthService);

      if (captured) captured(mockFbUser());
      expect(svc.currentUser()?.id).toBe('u1');
    });
  });
});
