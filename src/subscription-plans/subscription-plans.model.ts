export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  interval: 'month' | 'year' | 'week' | 'day';
  intervalCount: number;
  stripeProductId?: string;
  stripePriceId?: string;
  isActive: boolean;
  features: string[];
  maxCourses?: number;
  trialDays?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubscriptionPlanDto {
  name: string;
  description?: string;
  price: number;
  currency: string;
  interval: 'month' | 'year' | 'week' | 'day';
  intervalCount: number;
  features: string[];
  maxCourses?: number;
  trialDays?: number;
}

export interface UpdateSubscriptionPlanDto {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  features?: string[];
  maxCourses?: number;
  trialDays?: number;
  isActive?: boolean;
}

export interface StripePlanResult {
  productId: string;
  priceId: string;
}

