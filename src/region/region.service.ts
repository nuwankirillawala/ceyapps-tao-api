import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as IPinfo from 'ipinfo';

export interface RegionInfo {
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  ip?: string;
}

@Injectable()
export class RegionService {
  private readonly logger = new Logger(RegionService.name);
  private ipinfo: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>(process.env.IPINFO_API_KEY);
    this.ipinfo = new IPinfo(apiKey);
  }

  /**
   * Get region information from IP address
   * @param ip - IP address to lookup
   * @returns Promise<RegionInfo | null>
   */
  async getRegionFromIp(ip: string): Promise<RegionInfo | null> {
    try {
      // Skip local/private IPs
      if (this.isPrivateIp(ip)) {
        this.logger.warn(`Skipping private IP: ${ip}`);
        return null;
      }

      this.logger.log(`Looking up region for IP: ${ip}`);
      
      const response = await this.ipinfo.lookupIp(ip);
      
      if (!response) {
        this.logger.warn(`No response from IPinfo for IP: ${ip}`);
        return null;
      }

      const regionInfo: RegionInfo = {
        country: response.country || null,
        region: response.region || null,
        city: response.city || null,
        timezone: response.timezone || null,
        ip: ip,
      };

      this.logger.log(`Region info retrieved: ${JSON.stringify(regionInfo)}`);
      return regionInfo;
    } catch (error) {
      this.logger.error(`Error getting region info for IP ${ip}:`, error);
      return null;
    }
  }

  /**
   * Extract IP address from request headers
   * @param req - Express request object
   * @returns string | null
   */
  extractIpFromRequest(req: any): string | null {
    // Check various headers for the real IP
    const forwarded = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    const cfConnectingIp = req.headers['cf-connecting-ip']; // Cloudflare
    const xClientIp = req.headers['x-client-ip'];
    
    if (cfConnectingIp) {
      return cfConnectingIp;
    }
    
    if (realIp) {
      return realIp;
    }
    
    if (xClientIp) {
      return xClientIp;
    }
    
    if (forwarded) {
      // x-forwarded-for can contain multiple IPs, take the first one
      const ips = forwarded.split(',');
      return ips[0].trim();
    }
    
    // Fallback to connection remote address
    return req.connection?.remoteAddress || req.socket?.remoteAddress || null;
  }

  /**
   * Check if IP is private/local
   * @param ip - IP address to check
   * @returns boolean
   */
  private isPrivateIp(ip: string): boolean {
    // Remove IPv6 prefix if present
    const cleanIp = ip.replace(/^::ffff:/, '');
    
    // Check for localhost
    if (cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp === 'localhost') {
      return true;
    }
    
    // Check for private IPv4 ranges
    const privateRanges = [
      /^10\./,                    // 10.0.0.0/8
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
      /^192\.168\./,              // 192.168.0.0/16
      /^169\.254\./,              // 169.254.0.0/16 (link-local)
    ];
    
    return privateRanges.some(range => range.test(cleanIp));
  }
}
