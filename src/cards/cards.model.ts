export interface PaymentMethod {
  id: string;
  customerId: string;
  type: 'card' | 'bank_account' | 'sepa_debit';
  card?: {
    brand: string;
    country: string;
    expMonth: number;
    expYear: number;
    last4: string;
    funding: string;
  };
  billingDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentMethodDto {
  customerId: string;
  paymentMethodId: string;
  billingDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
}

export interface UpdatePaymentMethodDto {
  billingDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
  isDefault?: boolean;
}

export interface AttachCardDto {
  customerId: string;
  paymentMethodId: string;
  billingDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
}

