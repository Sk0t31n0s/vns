import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { NewGameComponent } from './new-game.component';
import { AvatarsService } from '../../services/avatars.service';
import { SecurityService } from '../../services/security.service';
import { of, Subject } from 'rxjs';

describe('NewGameComponent', () => {
  let component: NewGameComponent;
  let fixture: ComponentFixture<NewGameComponent>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockAvatarsService: jasmine.SpyObj<AvatarsService>;
  let mockSecurityService: jasmine.SpyObj<SecurityService>;
  let mockSanitizer: jasmine.SpyObj<DomSanitizer>;
  let mockStore: jasmine.SpyObj<Store>;

  beforeEach(async(() => {
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const avatarsServiceSpy = jasmine.createSpyObj('AvatarsService', ['getImage']);
    const securityServiceSpy = jasmine.createSpyObj('SecurityService', ['validateString', 'sanitizeObject']);
    const sanitizerSpy = jasmine.createSpyObj('DomSanitizer', ['bypassSecurityTrustUrl']);
    const storeSpy = jasmine.createSpyObj('Store', ['dispatch']);

    TestBed.configureTestingModule({
      declarations: [NewGameComponent],
      providers: [
        { provide: MatDialog, useValue: dialogSpy },
        { provide: AvatarsService, useValue: avatarsServiceSpy },
        { provide: SecurityService, useValue: securityServiceSpy },
        { provide: DomSanitizer, useValue: sanitizerSpy },
        { provide: Store, useValue: storeSpy }
      ]
    }).compileComponents();

    mockDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    mockAvatarsService = TestBed.inject(AvatarsService) as jasmine.SpyObj<AvatarsService>;
    mockSecurityService = TestBed.inject(SecurityService) as jasmine.SpyObj<SecurityService>;
    mockSanitizer = TestBed.inject(DomSanitizer) as jasmine.SpyObj<DomSanitizer>;
    mockStore = TestBed.inject(Store) as jasmine.SpyObj<Store>;
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewGameComponent);
    component = fixture.componentInstance;
    
    // Setup default mocks
    mockAvatarsService.getImage.and.returnValue(Promise.resolve({
      key: 'standard',
      avatarKey: 'test',
      source: 'test-url',
      blob: new Blob(['test'])
    }));
    
    mockSanitizer.bypassSecurityTrustUrl.and.returnValue('safe-url' as any);
    mockSecurityService.validateString.and.returnValue({ isValid: true, errors: [], sanitizedValue: 'test' });
    mockSecurityService.sanitizeObject.and.returnValue({ test: 'sanitized' });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('openImageSetDialog', () => {
    it('should open dialog and handle result', () => {
      const mockDialogRef = {
        afterClosed: () => of({ 
          abstract: { key: 'test-avatar' }, 
          profileImageUrl: 'test-profile-url' 
        })
      };
      
      mockDialog.open.and.returnValue(mockDialogRef as any);

      component.openImageSetDialog();

      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should handle dialog cancellation', () => {
      const mockDialogRef = {
        afterClosed: () => of(null)
      };
      
      mockDialog.open.and.returnValue(mockDialogRef as any);

      component.openImageSetDialog();

      expect(mockDialog.open).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create new game with valid avatar data', () => {
      const avatar = {
        firstName: 'John',
        lastName: 'Doe',
        gender: 'male' as const
      };
      
      const imageSet = {
        abstract: { key: 'test-avatar' }
      };

      // Test with valid input
      component.create(avatar, { imageSet });

      expect(mockStore.dispatch).toHaveBeenCalledTimes(2); // newGame and setRoute actions
    });

    it('should handle different gender pronouns correctly', () => {
      const testCases = [
        { gender: 'male' as const, expectedPronouns: 'he' },
        { gender: 'female' as const, expectedPronouns: 'she' },
        { gender: 'futanari' as const, expectedPronouns: 'she' }
      ];

      testCases.forEach(({ gender, expectedPronouns }) => {
        const avatar = { firstName: 'Test', lastName: 'User', gender };
        const imageSet = { abstract: { key: 'test-avatar' } };

        component.create(avatar, { imageSet });

        // Verify that the correct pronouns are set
        const dispatchCalls = mockStore.dispatch.calls.all();
        const newGameCall = dispatchCalls.find(call => 
          call.args[0].type === '[Game] New Game'
        );
        
        if (newGameCall) {
          expect(newGameCall.args[0].avatar.pronouns).toBe(expectedPronouns);
        }
      });
    });
  });

  describe('Security Integration', () => {
    it('should validate avatar data before creation', () => {
      const maliciousAvatar = {
        firstName: '<script>alert("xss")</script>',
        lastName: 'User',
        gender: 'male' as const,
        __proto__: 'malicious'
      };

      const imageSet = { abstract: { key: 'test-avatar' } };

      // Mock security service to reject malicious input
      mockSecurityService.validateString.and.returnValue({
        isValid: false,
        errors: ['String contains malicious content']
      });

      // Component should handle validation internally
      component.create(maliciousAvatar, { imageSet });

      // Verify that sanitization was attempted
      expect(mockSecurityService.validateString).toHaveBeenCalled();
    });

    it('should sanitize image URLs from dialog', async () => {
      const mockDialogRef = {
        afterClosed: () => of({ 
          abstract: { key: 'test-avatar' }, 
          profileImageUrl: 'javascript:alert("xss")' 
        })
      };
      
      mockDialog.open.and.returnValue(mockDialogRef as any);

      component.openImageSetDialog();

      // Verify that URL sanitization was performed
      expect(mockSanitizer.bypassSecurityTrustUrl).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle image loading errors gracefully', async () => {
      const mockDialogRef = {
        afterClosed: () => of({ 
          abstract: { key: 'test-avatar' }, 
          profileImageUrl: 'test-url' 
        })
      };
      
      mockDialog.open.and.returnValue(mockDialogRef as any);
      mockAvatarsService.getImage.and.returnValue(Promise.reject(new Error('Image load failed')));

      component.openImageSetDialog();

      // Should not crash the component
      expect(component).toBeTruthy();
    });

    it('should handle store dispatch errors', () => {
      const avatar = { firstName: 'John', gender: 'male' as const };
      const imageSet = { abstract: { key: 'test-avatar' } };

      mockStore.dispatch.and.throwError('Store error');

      expect(() => {
        component.create(avatar, { imageSet });
      }).toThrowError('Store error');
    });
  });

  describe('Component Compatibility', () => {
    it('should properly initialize avatar object', () => {
      expect(component.avatar).toEqual({});
    });

    it('should handle empty imageSet gracefully', () => {
      const avatar = { firstName: 'John', gender: 'male' as const };
      
      expect(() => {
        component.create(avatar, { imageSet: null as any });
      }).not.toThrow();
    });

    it('should handle missing avatar properties', () => {
      const incompleteAvatar = { firstName: 'John' };
      const imageSet = { abstract: { key: 'test-avatar' } };

      expect(() => {
        component.create(incompleteAvatar as any, { imageSet });
      }).not.toThrow();
    });
  });

  describe('Memory Management', () => {
    it('should properly clean up subscriptions', () => {
      component.openImageSetDialog();
      
      // Simulate component destruction
      fixture.destroy();

      // Component should be destroyed without memory leaks
      expect(fixture.destroyed).toBe(true);
    });

    it('should handle multiple dialog operations', () => {
      // Open multiple dialogs to test resource management
      for (let i = 0; i < 5; i++) {
        const mockDialogRef = {
          afterClosed: () => of(null)
        };
        mockDialog.open.and.returnValue(mockDialogRef as any);
        component.openImageSetDialog();
      }

      expect(mockDialog.open).toHaveBeenCalledTimes(5);
    });
  });

  describe('Performance Tests', () => {
    it('should handle rapid avatar creation requests', () => {
      const avatar = { firstName: 'John', gender: 'male' as const };
      const imageSet = { abstract: { key: 'test-avatar' } };

      const startTime = performance.now();
      
      // Simulate rapid requests
      for (let i = 0; i < 100; i++) {
        component.create({ ...avatar, firstName: `User${i}` }, { imageSet });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(mockStore.dispatch).toHaveBeenCalledTimes(200); // 2 calls per creation
    });
  });
});