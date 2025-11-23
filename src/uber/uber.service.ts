import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import fetch from 'node-fetch';
import { env } from '../common/env';
import { DeliveryRequest, UberApiResponse, DeliveryQuoteRequest, DeliveryQuoteResponse, DeliveryListQuery, DeliveryListResponse, CreateDeliveryRequest, CreateDeliveryResponse } from './interfaces';
import { UberAuthService } from './uber-auth.service';
import { UBER_CONSTANTS } from './constants';
import { DeliveryEntity } from './entities';

@Injectable()
export class UberService {
  private readonly logger = new Logger(UberService.name);

  constructor(private readonly authService: UberAuthService) {}

  async createDelivery(
    customerId: string,
    deliveryData: CreateDeliveryRequest,
    customToken?: string,
  ): Promise<CreateDeliveryResponse> {
    // Get token: use custom token if provided, otherwise get OAuth token
    const token = customToken || (await this.authService.getAccessToken());

    if (!customerId) {
      this.logger.error('No Customer ID provided');
      throw new HttpException(
        'Customer ID is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate coordinates
    this.validateCoordinates(deliveryData);

    // Generate dates automatically if not provided
    const processedDeliveryData = this.generateDatesIfNeeded(deliveryData);

    const url = `${env.uber.baseUrl}/customers/${customerId}/deliveries`;

    try {
      this.logger.log(`Creating delivery to Uber API: ${url}`);
      this.logger.debug(`Delivery data: ${JSON.stringify(processedDeliveryData)}`);
      this.logger.debug(`Using token: ${token.substring(0, 20)}...${token.substring(token.length - 10)}`);
      this.logger.debug(`Token length: ${token.length}`);

      const headers = {
        'Content-Type': UBER_CONSTANTS.CONTENT_TYPES.JSON,
        'Accept': UBER_CONSTANTS.CONTENT_TYPES.JSON,
        'User-Agent': 'Postman/UberEatsMarketplaceCollections',
        Authorization: `Bearer ${token}`,
      };

      this.logger.debug(`Request headers: ${JSON.stringify(headers)}`);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(processedDeliveryData),
      });

      const data = await response.json();

      if (!response.ok) {
        this.logger.error(
          `Uber API error: ${response.status} - ${JSON.stringify(data)}`,
        );
        throw new HttpException(
          data || 'Error creating delivery',
          response.status,
        );
      }

      this.logger.log(`Delivery created successfully: ${data.id || 'N/A'}`);
      return data as CreateDeliveryResponse;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Unexpected error: ${error.message}`);
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createQuote(
    customerId: string,
    quoteData: DeliveryQuoteRequest,
    customToken?: string,
  ): Promise<DeliveryQuoteResponse> {
    // Get token: use custom token if provided, otherwise get OAuth token
    const token = customToken || (await this.authService.getAccessToken());

    if (!customerId) {
      this.logger.error('No Customer ID provided');
      throw new HttpException(
        'Customer ID is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate coordinates
    this.validateCoordinates(quoteData);

    // Generate dates automatically if not provided
    const processedQuoteData = this.generateDatesIfNeeded(quoteData);

    const url = `${env.uber.baseUrl}${UBER_CONSTANTS.QUOTES_ENDPOINT.replace(':customer_id', customerId)}`;

    try {
      this.logger.log(`Creating quote to Uber API: ${url}`);
      this.logger.debug(`Quote data: ${JSON.stringify(processedQuoteData, null, 2)}`);
      this.logger.debug(`Pickup address: ${processedQuoteData.pickup_address}`);
      this.logger.debug(`Dropoff address: ${processedQuoteData.dropoff_address}`);
      this.logger.debug(`Using token: ${token.substring(0, 20)}...${token.substring(token.length - 10)}`);
      this.logger.debug(`Token length: ${token.length}`);

      const headers = {
        'Content-Type': UBER_CONSTANTS.CONTENT_TYPES.JSON,
        'Accept': UBER_CONSTANTS.CONTENT_TYPES.JSON,
        'User-Agent': 'Postman/UberEatsMarketplaceCollections',
        Authorization: `Bearer ${token}`,
      };

      this.logger.debug(`Request headers: ${JSON.stringify(headers)}`);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(processedQuoteData),
      });

      // Read response as text first (can only read once)
      const textResponse = await response.text();
      const contentType = response.headers.get('content-type') || '';
      
      this.logger.debug(`Response status: ${response.status}`);
      this.logger.debug(`Response content-type: ${contentType}`);
      this.logger.debug(`Response body (first 500 chars): ${textResponse.substring(0, 500)}`);

      let data: any;

      // Try to parse as JSON
      try {
        data = JSON.parse(textResponse);
      } catch (parseError) {
        // If JSON parsing fails, log the actual response
        this.logger.error(
          `Failed to parse JSON response: ${parseError.message}`,
        );
        this.logger.error(`Full response body: ${textResponse}`);
        
        throw new HttpException(
          {
            error: 'Invalid JSON response from Uber API',
            status: response.status,
            contentType,
            responseBody: textResponse.substring(0, 1000),
          },
          response.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      if (!response.ok) {
        this.logger.error(
          `Uber API error: ${response.status} - ${JSON.stringify(data)}`,
        );
        
        // Provide more helpful error messages for common issues
        if (data.code === 'customer_blocked') {
          const errorMessage = {
            code: data.code,
            message: data.message,
            kind: data.kind,
            helpful_info: {
              suggestion: 'El customer_id no está autorizado para esta acción. Verifica que: 1) El customer_id pertenezca a tu organización, 2) El customer esté habilitado en el dashboard de Uber Direct, 3) Las credenciales OAuth sean de la misma cuenta.',
              customer_id: customerId,
            },
          };
          this.logger.error(`Customer blocked error details: ${JSON.stringify(errorMessage, null, 2)}`);
          throw new HttpException(errorMessage, response.status);
        }
        
        if (data.code === 'address_undeliverable') {
          const errorMessage = {
            code: data.code,
            message: data.message,
            kind: data.kind,
            metadata: data.metadata,
            helpful_info: {
              suggestion: 'Verifica que las coordenadas proporcionadas coincidan con las direcciones. Uber puede geocodificar las direcciones y usar esas coordenadas si las proporcionadas no coinciden.',
              coordinates_sent: {
                pickup: {
                  lat: processedQuoteData.pickup_latitude,
                  lon: processedQuoteData.pickup_longitude,
                  address: processedQuoteData.pickup_address,
                },
                dropoff: {
                  lat: processedQuoteData.dropoff_latitude,
                  lon: processedQuoteData.dropoff_longitude,
                  address: processedQuoteData.dropoff_address,
                },
              },
            },
          };
          
          this.logger.error(
            `Address undeliverable error details: ${JSON.stringify(errorMessage, null, 2)}`,
          );
          
          throw new HttpException(
            errorMessage,
            response.status,
          );
        }
        
        throw new HttpException(
          data || 'Error creating quote',
          response.status,
        );
      }

      this.logger.log(`Quote created successfully: ${data.quote_id || 'N/A'}`);
      return data as DeliveryQuoteResponse;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Unexpected error: ${error.message}`);
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async testConnection(customToken?: string): Promise<any> {
    const token = customToken || (await this.authService.getAccessToken());
    
    // Test with a simple endpoint that doesn't require specific data
    const testUrl = `${env.uber.baseUrl}/customers/${process.env.UBER_DIRECT_CUSTOMER_ID}`;
    
    try {
      this.logger.log(`Testing connection to Uber API: ${testUrl}`);
      this.logger.debug(`Using token: ${token.substring(0, 20)}...${token.substring(token.length - 10)}`);

      const headers = {
        'Accept': UBER_CONSTANTS.CONTENT_TYPES.JSON,
        'User-Agent': 'Postman/UberEatsMarketplaceCollections',
        Authorization: `Bearer ${token}`,
      };

      this.logger.debug(`Test request headers: ${JSON.stringify(headers)}`);

      const response = await fetch(testUrl, {
        method: 'GET',
        headers,
      });

      const data = await response.text();
      
      this.logger.log(`Test response status: ${response.status}`);
      this.logger.debug(`Test response data: ${data}`);

      return {
        status: response.status,
        statusText: response.statusText,
        data: data,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error) {
      this.logger.error(`Test connection error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate coordinates are within valid ranges
   */
  private validateCoordinates(data: DeliveryQuoteRequest | CreateDeliveryRequest): void {
    const validateLatitude = (lat: number, name: string) => {
      if (typeof lat !== 'number' || isNaN(lat)) {
        throw new HttpException(
          `${name} must be a valid number`,
          HttpStatus.BAD_REQUEST,
        );
      }
      if (lat < -90 || lat > 90) {
        throw new HttpException(
          `${name} must be between -90 and 90 degrees`,
          HttpStatus.BAD_REQUEST,
        );
      }
    };

    const validateLongitude = (lon: number, name: string) => {
      if (typeof lon !== 'number' || isNaN(lon)) {
        throw new HttpException(
          `${name} must be a valid number`,
          HttpStatus.BAD_REQUEST,
        );
      }
      if (lon < -180 || lon > 180) {
        throw new HttpException(
          `${name} must be between -180 and 180 degrees`,
          HttpStatus.BAD_REQUEST,
        );
      }
    };

    if ('pickup_latitude' in data && 'pickup_longitude' in data) {
      validateLatitude(data.pickup_latitude, 'pickup_latitude');
      validateLongitude(data.pickup_longitude, 'pickup_longitude');
      
      this.logger.debug(
        `Pickup coordinates: lat=${data.pickup_latitude}, lon=${data.pickup_longitude}`,
      );
    }

    if ('dropoff_latitude' in data && 'dropoff_longitude' in data) {
      validateLatitude(data.dropoff_latitude, 'dropoff_latitude');
      validateLongitude(data.dropoff_longitude, 'dropoff_longitude');
      
      this.logger.debug(
        `Dropoff coordinates: lat=${data.dropoff_latitude}, lon=${data.dropoff_longitude}`,
      );
    }

    // Log distance calculation for debugging
    if (
      'pickup_latitude' in data &&
      'pickup_longitude' in data &&
      'dropoff_latitude' in data &&
      'dropoff_longitude' in data
    ) {
      const distanceKm = this.calculateHaversineDistance(
        data.pickup_latitude,
        data.pickup_longitude,
        data.dropoff_latitude,
        data.dropoff_longitude,
      );
      const distanceMiles = distanceKm * 0.621371;
      
      this.logger.debug(
        `Calculated distance: ${distanceKm.toFixed(2)} km (${distanceMiles.toFixed(2)} miles)`,
      );
      
      // Warn if distance is very large (could indicate coordinate mismatch)
      if (distanceKm > 50) {
        this.logger.warn(
          `La distancia calculada entre pickup y dropoff es muy grande (${distanceKm.toFixed(2)} km). ` +
          `Esto podría indicar que las coordenadas no coinciden con las direcciones. ` +
          `Uber puede geocodificar las direcciones y usar esas coordenadas, causando un error de distancia.`,
        );
      }
      
      // Warn if distance exceeds Uber's typical delivery radius (10 miles = ~16 km)
      if (distanceMiles > 10) {
        this.logger.warn(
          `La distancia calculada (${distanceMiles.toFixed(2)} millas) excede el radio típico de entrega de Uber (10 millas). ` +
          `Esto probablemente resultará en un error de "address_undeliverable".`,
        );
      }
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) *
        Math.cos(this.degreesToRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Generate dates automatically following Uber's requirements if not provided
   * Uber requirements:
   * - pickup_ready_dt < pickup_deadline_dt
   * - dropoff_ready_dt <= pickup_deadline_dt (IMPORTANT: dropoff_ready must be at or before pickup_deadline)
   * - dropoff_ready_dt < dropoff_deadline_dt
   */
  private generateDatesIfNeeded(data: DeliveryQuoteRequest | CreateDeliveryRequest): DeliveryQuoteRequest | CreateDeliveryRequest {
    const now = new Date();
    
    // Helper function to parse and validate dates
    const parseDate = (dateString: string | undefined): Date | null => {
      if (!dateString) return null;
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        this.logger.warn(`Invalid date string provided: ${dateString}. Will generate a new date.`);
        return null;
      }
      return date;
    };
    
    // Parse provided dates or generate new ones
    let pickupReady = parseDate(data.pickup_ready_dt);
    let pickupDeadline = parseDate(data.pickup_deadline_dt);
    let dropoffReady = parseDate(data.dropoff_ready_dt);
    let dropoffDeadline = parseDate(data.dropoff_deadline_dt);
    
    // Generate missing dates
    if (!pickupReady) {
      pickupReady = new Date(now.getTime() + 20 * 60 * 1000); // +20 minutes
    }
    
    if (!pickupDeadline) {
      pickupDeadline = new Date(pickupReady.getTime() + 15 * 60 * 1000); // 15 min after pickup_ready
    }
    
    if (!dropoffReady) {
      // Must be at or before pickup_deadline
      dropoffReady = new Date(pickupDeadline.getTime() - 5 * 60 * 1000); // 5 min before pickup_deadline
    }
    
    if (!dropoffDeadline) {
      dropoffDeadline = new Date(dropoffReady.getTime() + 20 * 60 * 1000); // 20 min after dropoff_ready
    }
    
    // Validate date constraints
    if (dropoffReady > pickupDeadline) {
      this.logger.warn(
        `dropoff_ready_dt (${dropoffReady.toISOString()}) is after pickup_deadline_dt (${pickupDeadline.toISOString()}). ` +
        `Adjusting dropoff_ready to be equal to pickup_deadline.`,
      );
      dropoffReady = new Date(pickupDeadline);
    }
    
    if (pickupReady >= pickupDeadline) {
      throw new HttpException(
        'pickup_ready_dt must be before pickup_deadline_dt',
        HttpStatus.BAD_REQUEST,
      );
    }
    
    if (dropoffReady >= dropoffDeadline) {
      throw new HttpException(
        'dropoff_ready_dt must be before dropoff_deadline_dt',
        HttpStatus.BAD_REQUEST,
      );
    }
    
    this.logger.debug('Date validation passed:');
    this.logger.debug(`  pickup_ready_dt: ${pickupReady.toISOString()}`);
    this.logger.debug(`  pickup_deadline_dt: ${pickupDeadline.toISOString()}`);
    this.logger.debug(`  dropoff_ready_dt: ${dropoffReady.toISOString()} (<= pickup_deadline)`);
    this.logger.debug(`  dropoff_deadline_dt: ${dropoffDeadline.toISOString()}`);

    return {
      ...data,
      pickup_ready_dt: pickupReady.toISOString(),
      pickup_deadline_dt: pickupDeadline.toISOString(),
      dropoff_ready_dt: dropoffReady.toISOString(),
      dropoff_deadline_dt: dropoffDeadline.toISOString(),
    };
  }

  async listDeliveries(
    customerId: string,
    queryParams: DeliveryListQuery,
    customToken?: string,
  ): Promise<DeliveryListResponse> {
    // Get token: use custom token if provided, otherwise get OAuth token
    const token = customToken || (await this.authService.getAccessToken());

    if (!customerId) {
      this.logger.error('No Customer ID provided');
      throw new HttpException(
        'Customer ID is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const url = `${env.uber.baseUrl}${UBER_CONSTANTS.DELIVERIES_ENDPOINT.replace(':customer_id', customerId)}`;

    try {
      // Build query string from parameters
      const searchParams = new URLSearchParams();
      if (queryParams.limit) searchParams.append('limit', queryParams.limit.toString());
      if (queryParams.offset) searchParams.append('offset', queryParams.offset.toString());
      if (queryParams.status) searchParams.append('status', queryParams.status);
      if (queryParams.external_store_id) searchParams.append('external_store_id', queryParams.external_store_id);
      if (queryParams.created_after) searchParams.append('created_after', queryParams.created_after);
      if (queryParams.created_before) searchParams.append('created_before', queryParams.created_before);

      const fullUrl = searchParams.toString() ? `${url}?${searchParams.toString()}` : url;

      this.logger.log(`Listing deliveries from Uber API: ${fullUrl}`);
      this.logger.debug(`Query params: ${JSON.stringify(queryParams)}`);
      this.logger.debug(`Using token: ${token.substring(0, 20)}...${token.substring(token.length - 10)}`);

      const headers = {
        'Accept': UBER_CONSTANTS.CONTENT_TYPES.JSON,
        'User-Agent': 'Postman/UberEatsMarketplaceCollections',
        Authorization: `Bearer ${token}`,
      };

      this.logger.debug(`Request headers: ${JSON.stringify(headers)}`);

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        this.logger.error(
          `Uber API error: ${response.status} - ${JSON.stringify(data)}`,
        );
        throw new HttpException(
          data || 'Error listing deliveries',
          response.status,
        );
      }

      this.logger.log(`Deliveries listed successfully: ${data.deliveries?.length || 0} deliveries found`);
      return data as DeliveryListResponse;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Unexpected error: ${error.message}`);
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
