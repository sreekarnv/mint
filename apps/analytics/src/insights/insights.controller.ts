import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Req,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JWTAuthGuard, serializeBigInt } from '@mint/common';
import { PrismaService } from '../prisma/prisma.service';
import { InsightsService } from './insights.service';
import { Category } from '../generated/prisma/enums';

@Controller('api/v1/analytics')
export class InsightsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly insightsService: InsightsService,
  ) {}

  @Get('insights')
  @UseGuards(JWTAuthGuard)
  async getInsights(@Req() req: any) {
    return this.insightsService.getMonthlyInsights(req.user.sub);
  }

  @Get('top-merchants')
  @UseGuards(JWTAuthGuard)
  async getTopMerchants(@Req() req: any) {
    return this.insightsService.getTopMerchants(req.user.sub);
  }

  @Get('budgets')
  @UseGuards(JWTAuthGuard)
  async getBudgets(@Req() req: any) {
    const budgets = await this.prisma.budget.findMany({
      where: { userId: req.user.sub },
    });
    return serializeBigInt(budgets);
  }

  @Post('budgets')
  @UseGuards(JWTAuthGuard)
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
  async deleteBudget(@Req() req: any, @Param('id') id: string) {
    const budget = await this.prisma.budget.findUnique({ where: { id } });

    if (!budget || budget.userId !== req.user.sub) {
      throw new NotFoundException('Budget not found');
    }

    return serializeBigInt(
      await this.prisma.budget.delete({ where: { id } }),
    );
  }

  @Get('summary')
  @UseGuards(JWTAuthGuard)
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
