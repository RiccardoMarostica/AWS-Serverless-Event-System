import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header.component';
import { FooterComponent } from './components/footer.component';
import { SecurityService } from './services/security.service';
import { SecurityConfigUtil } from './utils/security-config.util';
import { PerformanceService } from './performance/performance.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  
  constructor(
    private securityService: SecurityService,
    private performanceService: PerformanceService
  ) {}
  
  ngOnInit(): void {
    this.initializeSecurity();
    this.initializePerformanceMonitoring();
  }
  
  ngOnDestroy(): void {
    // Log final performance metrics before app destruction
    if (!environment.production) {
      this.performanceService.logPerformanceMetrics();
    }
  }
  
  private initializeSecurity(): void {
    // Generate and log security report for monitoring
    const securityReport = SecurityConfigUtil.generateSecurityReport();
    
    if (!securityReport.validation.isValid) {
      console.error('Security configuration errors detected:', securityReport.validation.errors);
    }
    
    if (securityReport.validation.warnings.length > 0) {
      console.warn('Security configuration warnings:', securityReport.validation.warnings);
    }
    
    if (securityReport.recommendations.length > 0) {
      console.info('Security recommendations:', securityReport.recommendations);
    }
    
    // Validate secure environment
    if (!this.securityService.isSecureEnvironment()) {
      console.warn('Application is not running in a fully secure environment');
    }
  }
  
  private initializePerformanceMonitoring(): void {
    // Start performance monitoring
    if (!environment.production) {
      // In development, log performance metrics after a delay
      setTimeout(() => {
        this.performanceService.logPerformanceMetrics();
      }, 5000);
    }
    
    // Monitor memory usage periodically
    setInterval(() => {
      this.performanceService.measureMemoryUsage();
    }, 30000); // Every 30 seconds
  }
}
