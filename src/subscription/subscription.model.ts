export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  endedAt?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
  PAST_DUE = 'PAST_DUE',
  UNPAID = 'UNPAID',
  TRIALING = 'TRIALING',
  INCOMPLETE = 'INCOMPLETE',
  INCOMPLETE_EXPIRED = 'INCOMPLETE_EXPIRED'
}

export interface CreateSubscriptionDto {
  userId: string;
  planId: string;
  paymentMethodId: string;
  couponCode?: string;
  startTrial?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateSubscriptionDto {
  paymentMethodId?: string;
  cancelAtPeriodEnd?: boolean;
  planId?: string;
  metadata?: Record<string, any>;
}

export interface SubscriptionPayment {
  id: string;
  subscriptionId: string;
  stripeInvoiceId?: string;
  stripePaymentIntentId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paidAt?: Date;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
  REFUNDED = 'REFUNDED'
}

