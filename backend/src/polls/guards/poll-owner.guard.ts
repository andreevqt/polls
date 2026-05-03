import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PollOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const slug = request.params.slug;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Admin bypasses ownership check
    if (user.role === 'ADMIN') {
      return true;
    }

    const poll = await this.prisma.poll.findUnique({ where: { slug } });
    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    if (poll.ownerId !== user.id) {
      throw new ForbiddenException('You do not own this poll');
    }

    return true;
  }
}
