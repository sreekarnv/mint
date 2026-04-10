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
import { KycProfileResponse, KycService } from './kyc.service';

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
  async getKycProfile(
    @Req() req: any,
    @Param('userId') userId: string,
  ): Promise<KycProfileResponse> {
    return this.kycService.getKycProfile(userId, req.user.sub);
  }

  @Post('user/:userId/approve')
  @ApiOperation({ summary: 'Approve a KYC profile (admin)' })
  @ApiParam({ name: 'userId', description: 'Target user ID' })
  @ApiResponse({ status: 201, description: 'KYC profile approved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async approve(@Req() req: any, @Param('userId') userId: string) {
    return this.kycService.approveKyc(userId, req.user.sub);
  }

  @Post('user/:userId/reject')
  @ApiOperation({ summary: 'Reject a KYC profile (admin)' })
  @ApiParam({ name: 'userId', description: 'Target user ID' })
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
  async reject(
    @Req() req: any,
    @Param('userId') userId: string,
    @Body() body: { reason: string },
  ) {
    return this.kycService.rejectKyc(userId, req.user.sub, body.reason);
  }
}
