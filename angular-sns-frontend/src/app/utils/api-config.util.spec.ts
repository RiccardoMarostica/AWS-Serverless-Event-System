import { ApiConfigUtil } from './api-config.util';
import { environment } from '../../environments/environment';

describe('ApiConfigUtil', () => {

    describe('getEndpointUrl', () => {
        it('should construct correct URL with leading slash endpoint', () => {
            const result = ApiConfigUtil.getEndpointUrl('/subscribe');
            expect(result).toBe(`${environment.apiUrl}/subscribe`);
        });

        it('should construct correct URL without leading slash endpoint', () => {
            const result = ApiConfigUtil.getEndpointUrl('subscribe');
            expect(result).toBe(`${environment.apiUrl}/subscribe`);
        });

        it('should handle base URL with trailing slash', () => {
            const originalApiUrl = environment.apiUrl;
            (environment as any).apiUrl = 'http://localhost:3000/dev/';

            const result = ApiConfigUtil.getEndpointUrl('/subscribe');
            expect(result).toBe('http://localhost:3000/dev/subscribe');

            (environment as any).apiUrl = originalApiUrl;
        });
    });

    describe('isProduction', () => {
        it('should return environment production flag', () => {
            const result = ApiConfigUtil.isProduction();
            expect(result).toBe(environment.production);
        });
    });

    describe('getApiConfig', () => {
        it('should return API configuration object', () => {
            const config = ApiConfigUtil.getApiConfig();
            expect(config).toEqual({
                baseUrl: environment.apiUrl,
                apiKey: environment.apiKey,
                timeout: 30000
            });
        });
    });

    describe('validateConfig', () => {
        it('should return true for valid configuration', () => {
            const result = ApiConfigUtil.validateConfig();
            expect(result).toBe(true);
        });

        it('should return false for missing API URL', () => {
            const originalApiUrl = environment.apiUrl;
            (environment as any).apiUrl = '';

            const result = ApiConfigUtil.validateConfig();
            expect(result).toBe(false);

            (environment as any).apiUrl = originalApiUrl;
        });

        it('should return false for missing API key', () => {
            const originalApiKey = environment.apiKey;
            (environment as any).apiKey = '';

            const result = ApiConfigUtil.validateConfig();
            expect(result).toBe(false);

            (environment as any).apiKey = originalApiKey;
        });
    });
});