import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class UpdateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000, { message: 'Comment content cannot exceed 1000 characters' })
  content: string;

  @IsOptional()
  @IsString()
  isActive?: string;
}
