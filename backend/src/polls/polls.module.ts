import { Module } from '@nestjs/common';
import { PollsService } from './polls.service';
import { PollsController } from './polls.controller';
import { PollOwnerGuard } from './guards/poll-owner.guard';

@Module({
  controllers: [PollsController],
  providers: [PollsService, PollOwnerGuard],
  exports: [PollsService],
})
export class PollsModule {}
