# Event Notifications Frontend

An Angular frontend application for subscribing to event notifications via SNS. This application integrates with the existing serverless event system to provide a user-friendly interface for email subscriptions.

## Features

- Email subscription form with validation
- Responsive design for mobile and desktop
- Integration with AWS API Gateway
- Angular Material UI components
- Production-ready build configuration

## Development

### Prerequisites

- Node.js 18+ 
- npm 8+
- Angular CLI 20+

### Setup

```bash
npm install
```

### Development Server

```bash
npm start
```

Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

### Build

```bash
# Development build
npm run build

# Production build
npm run build:prod
```

### Testing

```bash
# Run unit tests
npm test

# Run tests in CI mode
npm run test:ci
```

### Environment Configuration

- Development: `src/environments/environment.ts`
- Production: `src/environments/environment.prod.ts`

Update the `apiUrl` and `apiKey` values to match your API Gateway configuration.

## Deployment

The application is designed to be deployed as a static website on AWS S3 with CloudFront distribution.

### Build for Production

```bash
npm run deploy:build
```

The build artifacts will be stored in the `dist/angular-sns-frontend/` directory, ready for S3 upload.

## Project Structure

```
src/
├── app/
│   ├── components/     # Reusable UI components
│   ├── services/       # Business logic and API services
│   ├── models/         # Data models and interfaces
│   ├── interfaces/     # TypeScript interfaces
│   └── utils/          # Utility functions
├── environments/       # Environment configurations
└── assets/            # Static assets
```

## Technology Stack

- Angular 20+
- Angular Material
- TypeScript
- RxJS
- Angular CLI

## Generated with Angular CLI

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.1.6.