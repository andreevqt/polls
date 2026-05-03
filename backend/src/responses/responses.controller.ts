import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ResponsesService } from './responses.service';
import { SubmitResponseDto } from './dto/submit-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('responses')
@Controller('polls/:slug/responses')
export class ResponsesController {
  constructor(private readonly responsesService: ResponsesService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a response to a poll' })
  @ApiResponse({ status: 201, description: 'Response submitted' })
  @ApiResponse({ status: 400, description: 'Required questions not answered' })
  @ApiResponse({ status: 403, description: 'No access to private poll' })
  @ApiResponse({ status: 409, description: 'Already responded' })
  @ApiResponse({ status: 410, description: 'Poll expired or inactive' })
  async submit(
    @Param('slug') slug: string,
    @Body() dto: SubmitResponseDto,
    @CurrentUser() user: { id: string } | null,
    @Headers('x-fingerprint') fingerprint?: string,
  ) {
    return this.responsesService.submit(slug, dto, user?.id, fingerprint);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all responses for a poll (owner/admin only)' })
  @ApiResponse({ status: 200, description: 'List of responses' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not the owner' })
  @ApiResponse({ status: 404, description: 'Poll not found' })
  async findByPoll(
    @Param('slug') slug: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.responsesService.findByPoll(slug, { page, limit });
  }
}
