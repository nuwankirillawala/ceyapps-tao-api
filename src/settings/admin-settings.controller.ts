import { 
  Controller, 
  Get, 
  Put, 
  Post, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  PipeTransform,
  Injectable,
  ArgumentMetadata
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam, 
  ApiQuery,
  ApiCreatedResponse
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { 
  CreateFaqDto, 
  UpdateFaqDto, 
  FaqResponseDto 
} from './dto/faq.dto';
import { 
  CreateContactDetailsDto, 
  UpdateContactDetailsDto, 
  ContactDetailsResponseDto 
} from './dto/contact-details.dto';
import { 
  CreateAvailableCountryDto, 
  UpdateAvailableCountryDto, 
  AvailableCountryResponseDto 
} from './dto/available-country.dto';
import { 
  CreateTrendingCourseDto, 
  UpdateTrendingCourseDto, 
  TrendingCourseResponseDto 
} from './dto/trending-course.dto';

@Injectable()
export class ParseBoolPipe implements PipeTransform<string, boolean | undefined> {
  transform(value: string, metadata: ArgumentMetadata): boolean | undefined {
    if (value === undefined || value === '') {
      return undefined;
    }
    if (value === 'true') return true;
    if (value === 'false') return false;
    throw new Error('Invalid boolean value');
  }
}

@ApiTags('admin-settings')
@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles(Role.ADMIN)
export class AdminSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // ===== FAQ SECTION =====

  @Get('faqs')
  @ApiOperation({ 
    summary: 'Get all FAQs (Admin)',
    description: 'Retrieve all FAQs with pagination and filtering for admin management'
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number,
    description: 'Page number for pagination',
    example: 1
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Number of items per page',
    example: 10
  })
  @ApiQuery({ 
    name: 'isActive', 
    required: false, 
    type: Boolean,
    description: 'Filter by active status',
    example: true
  })
  @ApiResponse({ 
    status: 200, 
    description: 'FAQs retrieved successfully',
    type: [FaqResponseDto]
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getAllFaqs(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('isActive', new ParseBoolPipe()) isActive?: boolean
  ) {
    return this.settingsService.getAllFaqs(page, limit, isActive);
  }

  @Get('faqs/:id')
  @ApiOperation({ 
    summary: 'Get FAQ by ID (Admin)',
    description: 'Retrieve a specific FAQ by ID for admin management'
  })
  @ApiParam({ name: 'id', description: 'FAQ ID', example: 'faq-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'FAQ retrieved successfully',
    type: FaqResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'FAQ not found' })
  async getFaqById(@Param('id') id: string) {
    return this.settingsService.getFaqById(id);
  }

  @Post('faqs')
  @ApiOperation({ 
    summary: 'Create FAQ (Admin)',
    description: 'Create a new FAQ entry'
  })
  @ApiCreatedResponse({ 
    description: 'FAQ created successfully',
    type: FaqResponseDto
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async createFaq(@Body() createFaqDto: CreateFaqDto) {
    return this.settingsService.createFaq(createFaqDto);
  }

  @Put('faqs/:id')
  @ApiOperation({ 
    summary: 'Update FAQ (Admin)',
    description: 'Update an existing FAQ entry'
  })
  @ApiParam({ name: 'id', description: 'FAQ ID', example: 'faq-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'FAQ updated successfully',
    type: FaqResponseDto
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'FAQ not found' })
  async updateFaq(@Param('id') id: string, @Body() updateFaqDto: UpdateFaqDto) {
    return this.settingsService.updateFaq(id, updateFaqDto);
  }

  @Delete('faqs/:id')
  @ApiOperation({ 
    summary: 'Delete FAQ (Admin)',
    description: 'Delete a FAQ entry'
  })
  @ApiParam({ name: 'id', description: 'FAQ ID', example: 'faq-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'FAQ deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'FAQ deleted successfully' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'FAQ not found' })
  @HttpCode(HttpStatus.OK)
  async deleteFaq(@Param('id') id: string) {
    return this.settingsService.deleteFaq(id);
  }

  @Put('faqs/:id/toggle-status')
  @ApiOperation({ 
    summary: 'Toggle FAQ status (Admin)',
    description: 'Toggle FAQ active/inactive status'
  })
  @ApiParam({ name: 'id', description: 'FAQ ID', example: 'faq-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'FAQ status toggled successfully',
    type: FaqResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'FAQ not found' })
  async toggleFaqStatus(@Param('id') id: string) {
    return this.settingsService.toggleFaqStatus(id);
  }

  // ===== CONTACT DETAILS SECTION =====

  @Get('contact-details')
  @ApiOperation({ 
    summary: 'Get all contact details (Admin)',
    description: 'Retrieve all contact details with pagination and filtering for admin management'
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number,
    description: 'Page number for pagination',
    example: 1
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Number of items per page',
    example: 10
  })
  @ApiQuery({ 
    name: 'type', 
    required: false, 
    type: String,
    description: 'Filter by contact type',
    example: 'EMAIL'
  })
  @ApiQuery({ 
    name: 'isActive', 
    required: false, 
    type: Boolean,
    description: 'Filter by active status',
    example: true
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Contact details retrieved successfully',
    type: [ContactDetailsResponseDto]
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getAllContactDetails(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('type') type?: string,
    @Query('isActive', new ParseBoolPipe()) isActive?: boolean
  ) {
    return this.settingsService.getAllContactDetails(page, limit, type, isActive);
  }

  @Get('contact-details/:id')
  @ApiOperation({ 
    summary: 'Get contact detail by ID (Admin)',
    description: 'Retrieve a specific contact detail by ID for admin management'
  })
  @ApiParam({ name: 'id', description: 'Contact detail ID', example: 'contact-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Contact detail retrieved successfully',
    type: ContactDetailsResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Contact detail not found' })
  async getContactDetailById(@Param('id') id: string) {
    return this.settingsService.getContactDetailById(id);
  }

  @Post('contact-details')
  @ApiOperation({ 
    summary: 'Create contact detail (Admin)',
    description: 'Create a new contact detail entry'
  })
  @ApiCreatedResponse({ 
    description: 'Contact detail created successfully',
    type: ContactDetailsResponseDto
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async createContactDetail(@Body() createContactDetailsDto: CreateContactDetailsDto) {
    return this.settingsService.createContactDetail(createContactDetailsDto);
  }

  @Put('contact-details/:id')
  @ApiOperation({ 
    summary: 'Update contact detail (Admin)',
    description: 'Update an existing contact detail entry'
  })
  @ApiParam({ name: 'id', description: 'Contact detail ID', example: 'contact-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Contact detail updated successfully',
    type: ContactDetailsResponseDto
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Contact detail not found' })
  async updateContactDetail(@Param('id') id: string, @Body() updateContactDetailsDto: UpdateContactDetailsDto) {
    return this.settingsService.updateContactDetail(id, updateContactDetailsDto);
  }

  @Delete('contact-details/:id')
  @ApiOperation({ 
    summary: 'Delete contact detail (Admin)',
    description: 'Delete a contact detail entry'
  })
  @ApiParam({ name: 'id', description: 'Contact detail ID', example: 'contact-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Contact detail deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Contact detail deleted successfully' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Contact detail not found' })
  @HttpCode(HttpStatus.OK)
  async deleteContactDetail(@Param('id') id: string) {
    return this.settingsService.deleteContactDetail(id);
  }

  // ===== AVAILABLE COUNTRIES SECTION =====

  @Get('countries')
  @ApiOperation({ 
    summary: 'Get all available countries (Admin)',
    description: 'Retrieve all available countries with pagination and filtering for admin management'
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number,
    description: 'Page number for pagination',
    example: 1
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Number of items per page',
    example: 10
  })
  @ApiQuery({ 
    name: 'isActive', 
    required: false, 
    type: Boolean,
    description: 'Filter by active status',
    example: true
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Countries retrieved successfully',
    type: [AvailableCountryResponseDto]
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getAllCountries(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('isActive', new ParseBoolPipe()) isActive?: boolean
  ) {
    return this.settingsService.getAllCountries(page, limit, isActive);
  }

  @Get('countries/:id')
  @ApiOperation({ 
    summary: 'Get country by ID (Admin)',
    description: 'Retrieve a specific country by ID for admin management'
  })
  @ApiParam({ name: 'id', description: 'Country ID', example: 'country-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Country retrieved successfully',
    type: AvailableCountryResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Country not found' })
  async getCountryById(@Param('id') id: string) {
    return this.settingsService.getCountryById(id);
  }

  @Post('countries')
  @ApiOperation({ 
    summary: 'Create country (Admin)',
    description: 'Create a new available country entry'
  })
  @ApiCreatedResponse({ 
    description: 'Country created successfully',
    type: AvailableCountryResponseDto
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async createCountry(@Body() createCountryDto: CreateAvailableCountryDto) {
    return this.settingsService.createCountry(createCountryDto);
  }

  @Put('countries/:id')
  @ApiOperation({ 
    summary: 'Update country (Admin)',
    description: 'Update an existing available country entry'
  })
  @ApiParam({ name: 'id', description: 'Country ID', example: 'country-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Country updated successfully',
    type: AvailableCountryResponseDto
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Country not found' })
  async updateCountry(@Param('id') id: string, @Body() updateCountryDto: UpdateAvailableCountryDto) {
    return this.settingsService.updateCountry(id, updateCountryDto);
  }

  @Delete('countries/:id')
  @ApiOperation({ 
    summary: 'Delete country (Admin)',
    description: 'Delete an available country entry'
  })
  @ApiParam({ name: 'id', description: 'Country ID', example: 'country-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Country deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Country deleted successfully' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Country not found' })
  @HttpCode(HttpStatus.OK)
  async deleteCountry(@Param('id') id: string) {
    return this.settingsService.deleteCountry(id);
  }

  // ===== TRENDING COURSES SECTION =====

  @Get('trending-courses')
  @ApiOperation({ 
    summary: 'Get all trending courses (Admin)',
    description: 'Retrieve all trending courses with pagination and filtering for admin management'
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number,
    description: 'Page number for pagination',
    example: 1
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Number of items per page',
    example: 10
  })
  @ApiQuery({ 
    name: 'isActive', 
    required: false, 
    type: Boolean,
    description: 'Filter by active status',
    example: true
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Trending courses retrieved successfully',
    type: [TrendingCourseResponseDto]
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getAllTrendingCourses(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('isActive', new ParseBoolPipe()) isActive?: boolean
  ) {
    return this.settingsService.getAllTrendingCourses(page, limit, isActive);
  }

  @Get('trending-courses/:id')
  @ApiOperation({ 
    summary: 'Get trending course by ID (Admin)',
    description: 'Retrieve a specific trending course by ID for admin management'
  })
  @ApiParam({ name: 'id', description: 'Trending course ID', example: 'trending-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Trending course retrieved successfully',
    type: TrendingCourseResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Trending course not found' })
  async getTrendingCourseById(@Param('id') id: string) {
    return this.settingsService.getTrendingCourseById(id);
  }

  @Post('trending-courses')
  @ApiOperation({ 
    summary: 'Create trending course (Admin)',
    description: 'Create a new trending course entry'
  })
  @ApiCreatedResponse({ 
    description: 'Trending course created successfully',
    type: TrendingCourseResponseDto
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async createTrendingCourse(@Body() createTrendingCourseDto: CreateTrendingCourseDto) {
    return this.settingsService.createTrendingCourse(createTrendingCourseDto);
  }

  @Put('trending-courses/:id')
  @ApiOperation({ 
    summary: 'Update trending course (Admin)',
    description: 'Update an existing trending course entry'
  })
  @ApiParam({ name: 'id', description: 'Trending course ID', example: 'trending-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Trending course updated successfully',
    type: TrendingCourseResponseDto
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Trending course not found' })
  async updateTrendingCourse(@Param('id') id: string, @Body() updateTrendingCourseDto: UpdateTrendingCourseDto) {
    return this.settingsService.updateTrendingCourse(id, updateTrendingCourseDto);
  }

  @Delete('trending-courses/:id')
  @ApiOperation({ 
    summary: 'Delete trending course (Admin)',
    description: 'Delete a trending course entry'
  })
  @ApiParam({ name: 'id', description: 'Trending course ID', example: 'trending-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Trending course deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Trending course deleted successfully' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Trending course not found' })
  @HttpCode(HttpStatus.OK)
  async deleteTrendingCourse(@Param('id') id: string) {
    return this.settingsService.deleteTrendingCourse(id);
  }
}
