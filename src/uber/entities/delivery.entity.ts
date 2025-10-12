import { Location, ManifestItem, CourierInfo } from '../interfaces/delivery.interface';
import { DeliveryStatus } from '../constants/uber.constants';

export class DeliveryEntity {
  id: string;
  status: DeliveryStatus;
  complete: boolean;
  kind: string;
  pickup: Location;
  dropoff: Location;
  manifest: ManifestItem[];
  created: Date;
  updated: Date;
  pickup_eta?: Date;
  dropoff_eta?: Date;
  pickup_ready?: Date;
  dropoff_ready?: Date;
  pickup_deadline?: Date;
  dropoff_deadline?: Date;
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

  constructor(data: any) {
    this.id = data.id;
    this.status = data.status;
    this.complete = data.complete;
    this.kind = data.kind;
    this.pickup = data.pickup;
    this.dropoff = data.dropoff;
    this.manifest = data.manifest || [];
    this.created = new Date(data.created);
    this.updated = new Date(data.updated);
    this.pickup_eta = data.pickup_eta ? new Date(data.pickup_eta) : undefined;
    this.dropoff_eta = data.dropoff_eta ? new Date(data.dropoff_eta) : undefined;
    this.pickup_ready = data.pickup_ready ? new Date(data.pickup_ready) : undefined;
    this.dropoff_ready = data.dropoff_ready ? new Date(data.dropoff_ready) : undefined;
    this.pickup_deadline = data.pickup_deadline ? new Date(data.pickup_deadline) : undefined;
    this.dropoff_deadline = data.dropoff_deadline ? new Date(data.dropoff_deadline) : undefined;
    this.courier = data.courier;
    this.tracking_url = data.tracking_url;
    this.undeliverable_action = data.undeliverable_action;
    this.undeliverable_reason = data.undeliverable_reason;
    this.courier_imminent = data.courier_imminent;
    this.uuid = data.uuid;
    this.external_id = data.external_id;
    this.fee = data.fee;
    this.currency = data.currency;
    this.currency_type = data.currency_type;
    this.tip = data.tip;
    this.cancellation_reason = data.cancellation_reason;
  }

  isActive(): boolean {
    return !this.complete && this.status !== 'cancelled';
  }

  hasCourier(): boolean {
    return !!this.courier;
  }

  getEstimatedDeliveryTime(): Date | null {
    return this.dropoff_eta ? new Date(this.dropoff_eta) : null;
  }
}
