import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserDto {
  @ApiProperty({ enum: Role, example: 'ADMIN' })
  @IsEnum(Role)
  role: Role;
}
