import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminGuard } from './guards/admin.guard';
import { UsersModule } from '../users/users.module';
import { PollsModule } from '../polls/polls.module';

@Module({
  imports: [UsersModule, PollsModule],
  controllers: [AdminController],
  providers: [AdminGuard],
})
export class AdminModule {}
