import {
  Controller,
  Get,
  Patch,
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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { UsersService } from '../users/users.service';
import { PollsService } from '../polls/polls.service';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { PollQueryDto } from '../polls/dto/poll-query.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly pollsService: PollsService,
  ) {}

  @Get('users')
  @ApiOperation({ summary: 'Get all users (admin only)' })
  @ApiResponse({ status: 200, description: 'Paginated list of users' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getUsers(@Query() query: { page?: number; limit?: number }) {
    return this.usersService.findAll(query);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user role (admin only)' })
  @ApiResponse({ status: 200, description: 'Updated user' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateRole(id, dto);
  }

  @Get('polls')
  @ApiOperation({ summary: 'Get all polls (admin only)' })
  @ApiResponse({ status: 200, description: 'Paginated list of all polls' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getPolls(@Query() query: PollQueryDto) {
    return this.pollsService.findAllAdmin(query);
  }

  @Delete('polls/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete any poll (admin only)' })
  @ApiResponse({ status: 204, description: 'Poll deleted' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @ApiResponse({ status: 404, description: 'Poll not found' })
  async deletePoll(@Param('id') id: string) {
    return this.pollsService.deleteById(id);
  }
}
