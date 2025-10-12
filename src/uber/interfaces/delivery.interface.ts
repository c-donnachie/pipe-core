export interface Location {
  address: string;
  latitude?: number;
  longitude?: number;
  name?: string;
  phone_number?: string;
  instructions?: string;
  business_name?: string;
  building_code?: string;
}

export interface ManifestItem {
  name: string;
  quantity: number;
  size?: string; // 'small' | 'medium' | 'large' | 'xlarge' (kept flexible for API compatibility)
  dimensions?: {
    length?: number;
    height?: number;
    depth?: number;
  };
  must_be_upright?: boolean;
  price?: number;
}

export interface DeliveryRequest {
  pickup: Location;
  dropoff: Location;
  manifest?: ManifestItem[];
  manifest_total_value?: number;
  pickup_ready_dt?: number;
  pickup_deadline_dt?: number;
  dropoff_ready_dt?: number;
  dropoff_deadline_dt?: number;
  pickup_name?: string;
  pickup_phone_number?: string;
  dropoff_name?: string;
  dropoff_phone_number?: string;
  manifest_reference?: string;
  dropoff_notes?: string;
  pickup_notes?: string;
  dropoff_seller_notes?: string;
  pickup_seller_notes?: string;
  requires_dropoff_signature?: boolean;
  requires_id?: boolean;
  tip?: number;
  deliverable_action?: string;
  pickup_verification?: {
    picture?: boolean;
    signature?: boolean;
    barcodes?: string[];
    pincode?: string;
  };
  dropoff_verification?: {
    picture?: boolean;
    signature?: boolean;
    barcodes?: string[];
    pincode?: string;
  };
  external_store_id?: string;
}

export interface CourierInfo {
  name?: string;
  rating?: string;
  phone_number?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  img_href?: string;
  vehicle_type?: string;
}

export interface UberApiResponse {
  id: string;
  status: string;
  complete: boolean;
  kind: string;
  pickup: Location;
  dropoff: Location;
  manifest: ManifestItem[];
  created: string;
  updated: string;
  pickup_eta?: string;
  dropoff_eta?: string;
  pickup_ready?: string;
  dropoff_ready?: string;
  pickup_deadline?: string;
  dropoff_deadline?: string;
  courier?: CourierInfo;
  tracking_url?: string;
  undeliverable_action?: string;
  undeliverable_reason?: string;
  courier_imminent?: boolean;
  uuid?: string;
  external_id?: string;
  fee?: number;
  currency?: string;
  currency_type?: string;
  tip?: number;
  cancellation_reason?: string;
  [key: string]: any;
}

export interface DeliveryQuoteRequest {
  dropoff_address: string;
  pickup_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  dropoff_latitude: number;
  dropoff_longitude: number;
  pickup_ready_dt?: string;
  pickup_deadline_dt?: string;
  dropoff_ready_dt?: string;
  dropoff_deadline_dt?: string;
  pickup_phone_number: string;
  dropoff_phone_number: string;
  manifest_total_value: number;
  external_store_id: string;
}

export interface DeliveryQuoteResponse {
  quote_id: string;
  fee: number;
  currency: string;
  currency_type: string;
  pickup_eta?: string;
  dropoff_eta?: string;
  deliverable: boolean;
  reason?: string;
  expires_at: string;
  [key: string]: any;
}

export interface DeliveryListQuery {
  limit?: number;
  offset?: number;
  status?: string;
  external_store_id?: string;
  created_after?: string;
  created_before?: string;
}

export interface DeliveryListResponse {
  deliveries: UberApiResponse[];
  limit: number;
  offset: number;
  total?: number;
  [key: string]: any;
}

export interface CreateDeliveryRequest {
  dropoff_address: string;
  dropoff_name: string;
  dropoff_phone_number: string;
  manifest_items: ManifestItem[];
  pickup_address: string;
  pickup_name: string;
  pickup_phone_number: string;
  pickup_business_name?: string;
  pickup_latitude: number;
  pickup_longitude: number;
  pickup_notes?: string;
  pickup_verification?: {
    signature?: boolean;
    signature_requirement?: {
      enabled: boolean;
      collect_signer_name?: boolean;
      collect_signer_relationship?: boolean;
    };
    barcodes?: Array<{
      value: string;
      type: string;
    }>;
    identification?: {
      min_age: number;
    };
    picture?: boolean;
  };
  dropoff_business_name?: string;
  dropoff_latitude: number;
  dropoff_longitude: number;
  dropoff_notes?: string;
  dropoff_seller_notes?: string;
  dropoff_verification?: {
    signature?: boolean;
    signature_requirement?: {
      enabled: boolean;
      collect_signer_name?: boolean;
      collect_signer_relationship?: boolean;
    };
    barcodes?: Array<{
      value: string;
      type: string;
    }>;
    pincode?: {
      enabled: boolean;
    };
    identification?: {
      min_age: number;
    };
    picture?: boolean;
  };
  deliverable_action: string;
  manifest_reference?: string;
  manifest_total_value: number;
  quote_id?: string;
  undeliverable_action: string;
  pickup_ready_dt?: string;
  pickup_deadline_dt?: string;
  dropoff_ready_dt?: string;
  dropoff_deadline_dt?: string;
  requires_dropoff_signature: boolean;
  requires_id: boolean;
  tip?: number;
  idempotency_key?: string;
  external_store_id: string;
  return_verification?: {
    signature?: boolean;
    signature_requirement?: {
      enabled: boolean;
      collect_signer_name?: boolean;
      collect_signer_relationship?: boolean;
    };
    barcodes?: Array<{
      value: string;
      type: string;
    }>;
    picture?: boolean;
  };
  external_user_info?: {
    merchant_account?: {
      account_created_at: string;
      email: string;
    };
    device?: {
      id: string;
    };
  };
  external_id?: string;
  test_specifications?: {
    robo_courier_specification?: {
      mode: string;
    };
  };
}

export interface CreateDeliveryResponse extends UberApiResponse {
  // Inherits all properties from UberApiResponse
  // Additional properties specific to create delivery response
}
