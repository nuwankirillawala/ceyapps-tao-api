import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class UpdateReplyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000, { message: 'Reply content cannot exceed 1000 characters' })
  content: string;

  @IsOptional()
  @IsString()
  isActive?: string;
}
