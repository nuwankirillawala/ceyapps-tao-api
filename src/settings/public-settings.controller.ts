import { 
  Controller, 
  Get, 
  Query,
  ParseIntPipe
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiQuery
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { FaqResponseDto } from './dto/faq.dto';
import { ContactDetailsResponseDto } from './dto/contact-details.dto';
import { AvailableCountryResponseDto } from './dto/available-country.dto';
import { TrendingCourseResponseDto } from './dto/trending-course.dto';

@ApiTags('public-settings')
@Controller('public/settings')
export class PublicSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // ===== PUBLIC FAQ ENDPOINT =====

  @Get('faqs')
  @ApiOperation({ 
    summary: 'Get active FAQs (Public)',
    description: 'Retrieve all active FAQs for public users'
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Number of FAQs to retrieve (default: all)',
    example: 10
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Active FAQs retrieved successfully',
    type: [FaqResponseDto]
  })
  async getActiveFaqs(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    return this.settingsService.getActiveFaqs(limit);
  }

  // ===== PUBLIC CONTACT DETAILS ENDPOINT =====

  @Get('contact-details')
  @ApiOperation({ 
    summary: 'Get active contact details (Public)',
    description: 'Retrieve all active contact details for public users'
  })
  @ApiQuery({ 
    name: 'type', 
    required: false, 
    type: String,
    description: 'Filter by contact type',
    example: 'EMAIL'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Active contact details retrieved successfully',
    type: [ContactDetailsResponseDto]
  })
  async getActiveContactDetails(@Query('type') type?: string) {
    return this.settingsService.getActiveContactDetails(type);
  }

  // ===== PUBLIC AVAILABLE COUNTRIES ENDPOINT =====

  @Get('countries')
  @ApiOperation({ 
    summary: 'Get active available countries (Public)',
    description: 'Retrieve all active available countries for public users'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Active countries retrieved successfully',
    type: [AvailableCountryResponseDto]
  })
  async getActiveCountries() {
    return this.settingsService.getActiveCountries();
  }

  // ===== PUBLIC TRENDING COURSES ENDPOINT =====

  @Get('trending-courses')
  @ApiOperation({ 
    summary: 'Get active trending courses (Public)',
    description: 'Retrieve all active trending courses for public users'
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Number of trending courses to retrieve (default: all)',
    example: 10
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Active trending courses retrieved successfully',
    type: [TrendingCourseResponseDto]
  })
  async getActiveTrendingCourses(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    return this.settingsService.getActiveTrendingCourses(limit);
  }
}
