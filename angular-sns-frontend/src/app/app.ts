import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header.component';
import { FooterComponent } from './components/footer.component';
import { SecurityService } from './services/security.service';
import { SecurityConfigUtil } from './utils/security-config.util';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  
  constructor(private securityService: SecurityService) {}
  
  ngOnInit(): void {
    this.initializeSecurity();
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
}
