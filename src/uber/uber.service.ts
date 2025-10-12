import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import fetch from 'node-fetch';
import { env } from '../common/env';
import { DeliveryRequest, UberApiResponse, DeliveryQuoteRequest, DeliveryQuoteResponse } from './interfaces';
import { UberAuthService } from './uber-auth.service';
import { UBER_CONSTANTS } from './constants';
import { DeliveryEntity } from './entities';

@Injectable()
export class UberService {
  private readonly logger = new Logger(UberService.name);

  constructor(private readonly authService: UberAuthService) {}

  async createDelivery(
    deliveryData: DeliveryRequest,
    customToken?: string,
    customCustomerId?: string,
  ): Promise<UberApiResponse> {
    // Get token: use custom token if provided, otherwise get OAuth token
    const token = customToken || (await this.authService.getAccessToken());

    // Get customer ID: use custom if provided, otherwise use from env
    const customerId = customCustomerId || env.uber.customerId;

    if (!customerId) {
      this.logger.error('No Uber Direct Customer ID provided');
      throw new HttpException(
        'Uber Direct Customer ID is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const url = `${env.uber.baseUrl}/customers/${customerId}/deliveries`;

    try {
      this.logger.log(`Creating delivery to Uber API: ${url}`);
      this.logger.debug(`Delivery data: ${JSON.stringify(deliveryData)}`);
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
        body: JSON.stringify(deliveryData),
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
      return data as UberApiResponse;
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

    // Generate dates automatically if not provided
    const processedQuoteData = this.generateDatesIfNeeded(quoteData);

    const url = `${env.uber.baseUrl}${UBER_CONSTANTS.QUOTES_ENDPOINT.replace(':customer_id', customerId)}`;

    try {
      this.logger.log(`Creating quote to Uber API: ${url}`);
      this.logger.debug(`Quote data: ${JSON.stringify(processedQuoteData)}`);
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

      const data = await response.json();

      if (!response.ok) {
        this.logger.error(
          `Uber API error: ${response.status} - ${JSON.stringify(data)}`,
        );
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
   * Generate dates automatically following Uber's requirements if not provided
   */
  private generateDatesIfNeeded(quoteData: DeliveryQuoteRequest): DeliveryQuoteRequest {
    const now = new Date();
    
    // If any date is missing, generate all dates following Uber's requirements
    if (!quoteData.pickup_ready_dt || !quoteData.pickup_deadline_dt || 
        !quoteData.dropoff_ready_dt || !quoteData.dropoff_deadline_dt) {
      
      this.logger.debug('Generating dates automatically following Uber requirements');
      
      const pickupReady = new Date(now.getTime() + 20 * 60 * 1000); // +20 minutes
      const pickupDeadline = new Date(now.getTime() + 35 * 60 * 1000); // +35 minutes (15 min after pickup_ready)
      const dropoffReady = new Date(now.getTime() + 30 * 60 * 1000); // +30 minutes (before pickup_deadline)
      const dropoffDeadline = new Date(now.getTime() + 50 * 60 * 1000); // +50 minutes (20 min after dropoff_ready)

      return {
        ...quoteData,
        pickup_ready_dt: quoteData.pickup_ready_dt || pickupReady.toISOString(),
        pickup_deadline_dt: quoteData.pickup_deadline_dt || pickupDeadline.toISOString(),
        dropoff_ready_dt: quoteData.dropoff_ready_dt || dropoffReady.toISOString(),
        dropoff_deadline_dt: quoteData.dropoff_deadline_dt || dropoffDeadline.toISOString(),
      };
    }

    return quoteData;
  }
}
