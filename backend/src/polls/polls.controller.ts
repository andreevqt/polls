import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PollsService } from './polls.service';
import { CreatePollDto } from './dto/create-poll.dto';
import { UpdatePollDto } from './dto/update-poll.dto';
import { PollQueryDto } from './dto/poll-query.dto';
import { ReplaceQuestionsDto } from '../questions/dto/replace-questions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';
import { PollOwnerGuard } from './guards/poll-owner.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('polls')
@Controller('polls')
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated list of public active polls' })
  @ApiResponse({ status: 200, description: 'List of polls' })
  async findAll(@Query() query: PollQueryDto) {
    return this.pollsService.findAll(query);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get polls owned by current user' })
  @ApiResponse({ status: 200, description: 'User polls' })
  async findMy(
    @CurrentUser('id') userId: string,
    @Query() query: PollQueryDto,
  ) {
    return this.pollsService.findByOwner(userId, query);
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get poll by slug with questions' })
  @ApiQuery({ name: 'accessToken', required: false })
  @ApiResponse({ status: 200, description: 'Poll details' })
  @ApiResponse({ status: 403, description: 'Private poll - access token required' })
  @ApiResponse({ status: 404, description: 'Poll not found' })
  @ApiResponse({ status: 410, description: 'Poll has expired' })
  async findOne(
    @Param('slug') slug: string,
    @Query('accessToken') accessToken?: string,
  ) {
    return this.pollsService.findBySlug(slug, accessToken);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new poll' })
  @ApiResponse({ status: 201, description: 'Poll created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePollDto,
  ) {
    return this.pollsService.create(userId, dto);
  }

  @Patch(':slug')
  @UseGuards(JwtAuthGuard, PollOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update poll metadata' })
  @ApiResponse({ status: 200, description: 'Poll updated' })
  @ApiResponse({ status: 403, description: 'Not the owner' })
  @ApiResponse({ status: 404, description: 'Poll not found' })
  async update(
    @Param('slug') slug: string,
    @Body() dto: UpdatePollDto,
  ) {
    return this.pollsService.update(slug, dto);
  }

  @Delete(':slug')
  @UseGuards(JwtAuthGuard, PollOwnerGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a poll' })
  @ApiResponse({ status: 204, description: 'Poll deleted' })
  @ApiResponse({ status: 403, description: 'Not the owner' })
  @ApiResponse({ status: 404, description: 'Poll not found' })
  async delete(@Param('slug') slug: string) {
    return this.pollsService.delete(slug);
  }

  @Post(':slug/regenerate-token')
  @UseGuards(JwtAuthGuard, PollOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Regenerate private access token' })
  @ApiResponse({ status: 200, description: 'New access token' })
  async regenerateToken(@Param('slug') slug: string) {
    return this.pollsService.regenerateAccessToken(slug);
  }

  @Put(':slug/questions')
  @UseGuards(JwtAuthGuard, PollOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Replace all questions in a poll' })
  @ApiResponse({ status: 200, description: 'Questions replaced' })
  async replaceQuestions(
    @Param('slug') slug: string,
    @Body() dto: ReplaceQuestionsDto,
  ) {
    return this.pollsService.replaceQuestions(slug, dto);
  }
}
