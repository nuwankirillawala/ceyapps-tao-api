import { IsString, IsNotEmpty, IsUUID, MaxLength } from 'class-validator';

export class CreateReplyDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  commentId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000, { message: 'Reply content cannot exceed 1000 characters' })
  content: string;
}
