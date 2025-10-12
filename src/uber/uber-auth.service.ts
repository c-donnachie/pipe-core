import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import fetch from 'node-fetch';
import { env } from '../common/env';
import { TokenCache, OAuthTokenResponse } from './interfaces';
import { UBER_CONSTANTS } from './constants';

@Injectable()
export class UberAuthService {
  private readonly logger = new Logger(UberAuthService.name);
  private tokenCache: TokenCache | null = null;

  /**
   * Get a valid access token. Returns cached token if still valid,
   * otherwise requests a new one from Uber's OAuth endpoint.
   */
  async getAccessToken(): Promise<string> {
    // Check if we have a valid cached token
    if (this.tokenCache && this.isTokenValid()) {
      this.logger.debug('Using cached access token');
      return this.tokenCache.access_token;
    }

    // Request a new token
    this.logger.log('Requesting new access token from Uber OAuth');
    const token = await this.fetchNewAccessToken();
    return token;
  }

  /**
   * Check if the cached token is still valid.
   * Returns true if token exists and hasn't expired (with 5 min buffer).
   */
  private isTokenValid(): boolean {
    if (!this.tokenCache) {
      return false;
    }

    const now = Date.now();
    const bufferTime = UBER_CONSTANTS.TOKEN_BUFFER_TIME;
    const expiresWithBuffer = this.tokenCache.expires_at - bufferTime;

    return now < expiresWithBuffer;
  }

  /**
   * Fetch a new access token from Uber's OAuth endpoint
   * using client credentials grant type.
   */
  private async fetchNewAccessToken(): Promise<string> {
    const { clientId, clientSecret, authUrl } = env.uber;

    if (!clientId || !clientSecret) {
      this.logger.error('Missing Uber Direct OAuth credentials');
      throw new HttpException(
        'Uber Direct OAuth credentials not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const params = new URLSearchParams();
      params.append('client_id', clientId);
      params.append('client_secret', clientSecret);
      params.append('grant_type', UBER_CONSTANTS.DEFAULT_GRANT_TYPE);
      params.append('scope', UBER_CONSTANTS.DEFAULT_SCOPE);

      this.logger.debug(`Calling OAuth endpoint: ${authUrl}`);

      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': UBER_CONSTANTS.CONTENT_TYPES.FORM_URLENCODED,
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorData = await response.text();
        this.logger.error(
          `OAuth token request failed: ${response.status} - ${errorData}`,
        );
        throw new HttpException(
          'Failed to obtain access token from Uber',
          response.status,
        );
      }

      const data = (await response.json()) as OAuthTokenResponse;

      if (!data.access_token) {
        this.logger.error('OAuth response missing access_token');
        throw new HttpException(
          'Invalid OAuth response from Uber',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Cache the token with expiration time
      const expiresInMs = data.expires_in * 1000;
      this.tokenCache = {
        access_token: data.access_token,
        expires_at: Date.now() + expiresInMs,
      };

      this.logger.log(
        `Access token obtained successfully (expires in ${data.expires_in} seconds / ${Math.floor(data.expires_in / 86400)} days)`,
      );

      return data.access_token;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Unexpected error during OAuth: ${error.message}`);
      throw new HttpException(
        'Failed to authenticate with Uber',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Generate a new access token with custom parameters
   * This method bypasses the cache and always requests a new token
   */
  async generateToken(
    grantType: string = UBER_CONSTANTS.DEFAULT_GRANT_TYPE,
    scope: string = UBER_CONSTANTS.DEFAULT_SCOPE,
  ): Promise<OAuthTokenResponse> {
    const { clientId, clientSecret, authUrl } = env.uber;

    if (!clientId || !clientSecret) {
      this.logger.error('Missing Uber Direct OAuth credentials');
      throw new HttpException(
        'Uber Direct OAuth credentials not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const params = new URLSearchParams();
      params.append('client_id', clientId);
      params.append('client_secret', clientSecret);
      params.append('grant_type', grantType);
      params.append('scope', scope);

      this.logger.debug(`Calling OAuth endpoint: ${authUrl}`);
      this.logger.debug(`Request parameters: grant_type=${grantType}, scope=${scope}`);

      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': UBER_CONSTANTS.CONTENT_TYPES.FORM_URLENCODED,
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorData = await response.text();
        this.logger.error(
          `OAuth token request failed: ${response.status} - ${errorData}`,
        );
        throw new HttpException(
          'Failed to obtain access token from Uber',
          response.status,
        );
      }

      const data = (await response.json()) as OAuthTokenResponse;

      if (!data.access_token) {
        this.logger.error('OAuth response missing access_token');
        throw new HttpException(
          'Invalid OAuth response from Uber',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      this.logger.log(
        `Access token generated successfully (expires in ${data.expires_in} seconds / ${Math.floor(data.expires_in / 86400)} days)`,
      );

      return data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Unexpected error during OAuth: ${error.message}`);
      throw new HttpException(
        'Failed to authenticate with Uber',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Clear the cached token (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.logger.log('Clearing token cache');
    this.tokenCache = null;
  }
}
