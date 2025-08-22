import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingIndicatorComponent } from './loading-indicator.component';

describe('LoadingIndicatorComponent', () => {
  let component: LoadingIndicatorComponent;
  let fixture: ComponentFixture<LoadingIndicatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingIndicatorComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingIndicatorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show loading indicator by default', () => {
    fixture.detectChanges();
    const loadingElement = fixture.nativeElement.querySelector('.loading-indicator');
    expect(loadingElement).toBeTruthy();
  });

  it('should hide loading indicator when show is false', () => {
    component.show = false;
    fixture.detectChanges();
    const loadingElement = fixture.nativeElement.querySelector('.loading-indicator');
    expect(loadingElement).toBeFalsy();
  });

  it('should display text when provided', () => {
    component.text = 'Loading...';
    fixture.detectChanges();
    const textElement = fixture.nativeElement.querySelector('.loading-text');
    expect(textElement).toBeTruthy();
    expect(textElement.textContent.trim()).toBe('Loading...');
  });

  it('should not display text when not provided', () => {
    component.text = '';
    fixture.detectChanges();
    const textElement = fixture.nativeElement.querySelector('.loading-text');
    expect(textElement).toBeFalsy();
  });

  it('should apply small size class', () => {
    component.size = 'small';
    fixture.detectChanges();
    const spinner = fixture.nativeElement.querySelector('.spinner');
    expect(spinner.classList.contains('small')).toBeTruthy();
  });

  it('should apply large size class', () => {
    component.size = 'large';
    fixture.detectChanges();
    const spinner = fixture.nativeElement.querySelector('.spinner');
    expect(spinner.classList.contains('large')).toBeTruthy();
  });

  it('should apply medium size by default', () => {
    fixture.detectChanges();
    const spinner = fixture.nativeElement.querySelector('.spinner');
    expect(spinner.classList.contains('small')).toBeFalsy();
    expect(spinner.classList.contains('large')).toBeFalsy();
  });

  it('should apply inline class when inline is true', () => {
    component.inline = true;
    fixture.detectChanges();
    const loadingElement = fixture.nativeElement.querySelector('.loading-indicator');
    expect(loadingElement.classList.contains('inline')).toBeTruthy();
  });

  it('should not apply inline class by default', () => {
    fixture.detectChanges();
    const loadingElement = fixture.nativeElement.querySelector('.loading-indicator');
    expect(loadingElement.classList.contains('inline')).toBeFalsy();
  });
});