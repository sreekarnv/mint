import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { KycService } from './kyc.service';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin/kyc')
@UseGuards(AdminJwtGuard)
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get KYC profile for a user (admin)' })
  @ApiParam({ name: 'userId', description: 'Target user ID' })
  @ApiResponse({ status: 200, description: 'KYC profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getKycProfile(@Req() req: any, @Param('userId') userId: string) {
    return this.kycService.getKycProfile(userId, req.user.sub);
  }

  @Post(':profileId/approve')
  @ApiOperation({ summary: 'Approve a KYC profile (admin)' })
  @ApiParam({ name: 'profileId', description: 'KYC profile ID' })
  @ApiResponse({ status: 201, description: 'KYC profile approved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async approve(@Req() req: any, @Param('profileId') profileId: string) {
    return this.kycService.approveKyc(profileId, req.user.sub);
  }

  @Post(':profileId/reject')
  @ApiOperation({ summary: 'Reject a KYC profile (admin)' })
  @ApiParam({ name: 'profileId', description: 'KYC profile ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['reason'],
      properties: {
        reason: { type: 'string', example: 'Document quality too low' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'KYC profile rejected' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async reject(
    @Req() req: any,
    @Param('profileId') profileId: string,
    @Body() body: { reason: string },
  ) {
    return this.kycService.rejectKyc(profileId, req.user.sub, body.reason);
  }
}
