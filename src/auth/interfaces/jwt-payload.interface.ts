export interface JwtPayload {
  tenantId: string;
  iat?: number;
  exp?: number;
}

