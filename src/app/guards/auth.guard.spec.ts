import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { authGuard, noAuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

function mockRoute() {
  return {} as ActivatedRouteSnapshot;
}
function mockState() {
  return {} as RouterStateSnapshot;
}

describe('authGuard', () => {
  let authSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'isGuest']);
    routerSpy = jasmine.createSpyObj('Router', ['createUrlTree']);
    routerSpy.createUrlTree.and.returnValue(jasmine.anything() as any);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  it('should return true when the user is logged in', () => {
    authSpy.isLoggedIn.and.returnValue(true);
    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute(), mockState()));
    expect(result).toBeTrue();
  });

  it('should redirect to /login when the user is not logged in', () => {
    authSpy.isLoggedIn.and.returnValue(false);
    TestBed.runInInjectionContext(() => authGuard(mockRoute(), mockState()));
    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});

describe('noAuthGuard', () => {
  let authSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'isGuest']);
    routerSpy = jasmine.createSpyObj('Router', ['createUrlTree']);
    routerSpy.createUrlTree.and.returnValue(jasmine.anything() as any);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  it('should return true when the user is not logged in', () => {
    authSpy.isLoggedIn.and.returnValue(false);
    authSpy.isGuest.and.returnValue(false);
    const result = TestBed.runInInjectionContext(() => noAuthGuard(mockRoute(), mockState()));
    expect(result).toBeTrue();
  });

  it('should return true for guest users (allow them to register)', () => {
    authSpy.isLoggedIn.and.returnValue(true);
    authSpy.isGuest.and.returnValue(true);
    const result = TestBed.runInInjectionContext(() => noAuthGuard(mockRoute(), mockState()));
    expect(result).toBeTrue();
  });

  it('should redirect to / when a non-guest user is already logged in', () => {
    authSpy.isLoggedIn.and.returnValue(true);
    authSpy.isGuest.and.returnValue(false);
    TestBed.runInInjectionContext(() => noAuthGuard(mockRoute(), mockState()));
    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/']);
  });
});
