import * as dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: process.env.PORT || 3000,
  uber: {
    clientId: process.env.UBER_DIRECT_CLIENT_ID || '',
    clientSecret: process.env.UBER_DIRECT_CLIENT_SECRET || '',
    customerId: process.env.UBER_DIRECT_CUSTOMER_ID || '',
    authUrl: process.env.UBER_AUTH_URL || 'https://login.uber.com/oauth/v2/token',
    baseUrl: process.env.UBER_BASE_URL || 'https://api.uber.com/v1',
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    webhookUrl: process.env.TWILIO_WEBHOOK_URL || '',
  },
};
