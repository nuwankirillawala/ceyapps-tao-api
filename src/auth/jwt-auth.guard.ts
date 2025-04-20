import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// This guard is used to protect routes that require JWT authentication.
// It uses the Passport library to validate the JWT token in the request header.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
