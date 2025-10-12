export interface TokenCache {
  access_token: string;
  expires_at: number; // timestamp in milliseconds
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number; // seconds
  scope: string;
}

export interface OAuthRequest {
  grant_type: string;
  scope: string;
}
