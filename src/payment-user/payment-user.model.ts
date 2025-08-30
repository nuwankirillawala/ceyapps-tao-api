export interface PaymentUser {
  id: string;
  userId: string;
  stripeCustomerId?: string;
  email: string;
  name: string;
  phoneNumber?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentUserDto {
  userId: string;
  email: string;
  name: string;
  phoneNumber?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  metadata?: Record<string, any>;
}

export interface UpdatePaymentUserDto {
  email?: string;
  name?: string;
  phoneNumber?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  metadata?: Record<string, any>;
}
