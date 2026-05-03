import {
  Controller,
  Get,
  Param,
  UseGuards,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PollOwnerGuard } from '../polls/guards/poll-owner.guard';

@ApiTags('analytics')
@Controller('polls/:slug')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('analytics')
  @UseGuards(JwtAuthGuard, PollOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get aggregated analytics for a poll' })
  @ApiResponse({ status: 200, description: 'Analytics data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not the owner' })
  @ApiResponse({ status: 404, description: 'Poll not found' })
  async getAnalytics(@Param('slug') slug: string) {
    return this.analyticsService.getAnalytics(slug);
  }

  @Get('analytics/export')
  @UseGuards(JwtAuthGuard, PollOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export poll responses as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file download' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not the owner' })
  @ApiResponse({ status: 404, description: 'Poll not found' })
  async exportCsv(
    @Param('slug') slug: string,
    @Res() res: Response,
  ) {
    return this.analyticsService.exportCsv(slug, res);
  }
}
