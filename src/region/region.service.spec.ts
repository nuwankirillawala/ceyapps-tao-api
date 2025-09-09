import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RegionService } from './region.service';

describe('RegionService', () => {
  let service: RegionService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-api-key'),
          },
        },
      ],
    }).compile();

    service = module.get<RegionService>(RegionService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should extract IP from request headers', () => {
    const mockRequest = {
      headers: {
        'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        'x-real-ip': '203.0.113.1',
      },
      connection: {
        remoteAddress: '127.0.0.1',
      },
    };

    const ip = service.extractIpFromRequest(mockRequest);
    expect(ip).toBe('203.0.113.1');
  });

  it('should handle private IPs correctly', () => {
    const mockRequest = {
      headers: {},
      connection: {
        remoteAddress: '127.0.0.1',
      },
    };

    const ip = service.extractIpFromRequest(mockRequest);
    expect(ip).toBe('127.0.0.1');
  });
});
