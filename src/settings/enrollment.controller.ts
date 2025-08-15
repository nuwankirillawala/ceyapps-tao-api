import { 
  Controller, 
  Post, 
  Body, 
  UseGuards,
  Request
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EnrollCourseDto } from './dto/cart.dto';

@ApiTags('enrollment')
@Controller('enrollment')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EnrollmentController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post('enroll')
  @ApiOperation({ 
    summary: 'Enroll in a course',
    description: 'Directly enroll in a single course with Stripe payment processing'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Enrollment completed successfully',
    type: 'object'
  })
  @ApiResponse({ status: 400, description: 'Invalid enrollment data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({ status: 409, description: 'User already enrolled in this course' })
  async enrollCourse(
    @Request() req,
    @Body() enrollCourseDto: EnrollCourseDto
  ) {
    return this.settingsService.enrollCourse(req.user.userId, enrollCourseDto);
  }
}
