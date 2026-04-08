import { JWTAuthGuard, serializeBigInt } from '@mint/common';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Category } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { InsightsService } from './insights.service';

@ApiTags('analytics')
@ApiBearerAuth('access-token')
@Controller('api/v1/analytics')
export class InsightsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly insightsService: InsightsService,
  ) {}

  @Get('insights')
  @UseGuards(JWTAuthGuard)
  @ApiOperation({ summary: 'Get monthly spend insights by category' })
  @ApiResponse({ status: 200, description: 'Monthly insights' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getInsights(@Req() req: any) {
    return this.insightsService.getMonthlyInsights(req.user.sub);
  }

  @Get('top-merchants')
  @UseGuards(JWTAuthGuard)
  @ApiOperation({ summary: 'Get top merchants by spend this month' })
  @ApiResponse({ status: 200, description: 'Top merchants list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTopMerchants(@Req() req: any) {
    return this.insightsService.getTopMerchants(req.user.sub);
  }

  @Get('budgets')
  @UseGuards(JWTAuthGuard)
  @ApiOperation({
    summary: 'List all spending budgets for the authenticated user',
  })
  @ApiResponse({ status: 200, description: 'Budget list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBudgets(@Req() req: any) {
    const budgets = await this.prisma.budget.findMany({
      where: { userId: req.user.sub },
    });
    return serializeBigInt(budgets);
  }

  @Post('budgets')
  @UseGuards(JWTAuthGuard)
  @ApiOperation({ summary: 'Create a spending budget for a category' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['category', 'limitCents'],
      properties: {
        category: {
          type: 'string',
          enum: ['FOOD', 'TRANSPORT', 'ENTERTAINMENT', 'UTILITIES', 'OTHER'],
        },
        limitCents: {
          type: 'integer',
          example: 50000,
          description: 'Monthly limit in cents',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Budget created' })
  @ApiResponse({ status: 400, description: 'Invalid category or limitCents' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createBudget(@Req() req: any, @Body() body: any) {
    if (!Object.values(Category).includes(body.category)) {
      throw new BadRequestException('Invalid category');
    }

    if (!body.limitCents || body.limitCents <= 0) {
      throw new BadRequestException('limitCents must be positive');
    }

    const budget = await this.prisma.budget.create({
      data: {
        userId: req.user.sub,
        category: body.category,
        limitCents: BigInt(body.limitCents),
      },
    });
    return serializeBigInt(budget);
  }

  @Delete('budgets/:id')
  @UseGuards(JWTAuthGuard)
  @ApiOperation({ summary: 'Delete a budget' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  @ApiResponse({ status: 200, description: 'Budget deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  async deleteBudget(@Req() req: any, @Param('id') id: string) {
    const budget = await this.prisma.budget.findUnique({ where: { id } });

    if (!budget || budget.userId !== req.user.sub) {
      throw new NotFoundException('Budget not found');
    }

    return serializeBigInt(await this.prisma.budget.delete({ where: { id } }));
  }

  @Get('summary')
  @UseGuards(JWTAuthGuard)
  @ApiOperation({
    summary: 'Get current month spend summary (total and count)',
  })
  @ApiResponse({ status: 200, description: 'Monthly summary' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSummary(@Req() req: any) {
    const yearMonth = new Date().toISOString().slice(0, 7);

    const aggregates = await this.prisma.monthlyAggregate.findMany({
      where: { userId: req.user.sub, yearMonth },
    });

    return {
      yearMonth,
      totalSpend: aggregates.reduce(
        (sum, agg) => sum + Number(agg.totalCents),
        0,
      ),
      transactionCount: aggregates.reduce((sum, agg) => sum + agg.count, 0),
    };
  }
}
