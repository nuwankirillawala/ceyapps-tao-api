import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddPaymentMethodDto {
  @ApiProperty({
    description: 'Payment method type',
    example: 'card',
    enum: ['card', 'bank_account', 'paypal']
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: 'Payment method token from Stripe',
    example: 'pm_1234567890abcdef'
  })
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;

  @ApiPropertyOptional({
    description: 'Whether to set as default payment method',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  setAsDefault?: boolean;
}

export class UpdatePaymentMethodDto {
  @ApiPropertyOptional({
    description: 'Payment method nickname',
    example: 'My Credit Card'
  })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({
    description: 'Whether to set as default payment method',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  setAsDefault?: boolean;
}

export class SetDefaultPaymentMethodDto {
  @ApiProperty({
    description: 'Payment method ID to set as default',
    example: 'pm_1234567890abcdef'
  })
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;
}
