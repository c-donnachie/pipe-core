export const UBER_CONSTANTS = {
  // API Endpoints
  AUTH_URL: 'https://login.uber.com/oauth/v2/token',
  BASE_URL: 'https://api.uber.com/v1',
  QUOTES_ENDPOINT: '/customers/:customer_id/delivery_quotes',
  DELIVERIES_ENDPOINT: '/customers/:customer_id/deliveries',
  
  // OAuth Configuration
  DEFAULT_GRANT_TYPE: 'client_credentials',
  DEFAULT_SCOPE: 'eats.deliveries direct.organizations',
  
  // Token Management
  TOKEN_BUFFER_TIME: 5 * 60 * 1000, // 5 minutes in milliseconds
  
  // Delivery Status
  DELIVERY_STATUS: {
    PENDING: 'pending',
    ASSIGNED: 'assigned',
    PICKED_UP: 'picked_up',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
  } as const,
  
  // Vehicle Types
  VEHICLE_TYPES: {
    CAR: 'car',
    BIKE: 'bike',
    WALK: 'walk',
  } as const,
  
  // Item Sizes
  ITEM_SIZES: {
    SMALL: 'small',
    MEDIUM: 'medium',
    LARGE: 'large',
    XLARGE: 'xlarge',
  } as const,
  
  // Content Types
  CONTENT_TYPES: {
    JSON: 'application/json',
    FORM_URLENCODED: 'application/x-www-form-urlencoded',
  } as const,
} as const;

export type DeliveryStatus = typeof UBER_CONSTANTS.DELIVERY_STATUS[keyof typeof UBER_CONSTANTS.DELIVERY_STATUS];
export type VehicleType = typeof UBER_CONSTANTS.VEHICLE_TYPES[keyof typeof UBER_CONSTANTS.VEHICLE_TYPES];
export type ItemSize = typeof UBER_CONSTANTS.ITEM_SIZES[keyof typeof UBER_CONSTANTS.ITEM_SIZES];
