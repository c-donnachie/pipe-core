import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import fetch from 'node-fetch';
import { env } from '../common/env';
import { DeliveryRequest, UberApiResponse } from './interfaces';
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

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': UBER_CONSTANTS.CONTENT_TYPES.JSON,
          Authorization: `Bearer ${token}`,
        },
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
}
