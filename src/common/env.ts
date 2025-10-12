import * as dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: process.env.PORT || 3000,
  uber: {
    clientId: process.env.UBER_DIRECT_CLIENT_ID || '',
    clientSecret: process.env.UBER_DIRECT_CLIENT_SECRET || '',
    customerId: process.env.UBER_DIRECT_CUSTOMER_ID || '',
    authUrl: process.env.UBER_AUTH_URL,
    baseUrl: process.env.UBER_BASE_URL,
  },
};
