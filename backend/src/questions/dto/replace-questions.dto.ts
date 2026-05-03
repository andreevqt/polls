import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
  MinLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType } from '@prisma/client';

export class ReplaceOptionDto {
  @ApiPropertyOptional({ example: 'existing-uuid-or-null' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'Option A' })
  @IsString()
  @MinLength(1)
  text: string;

  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  orderIndex: number;
}

export class ReplaceQuestionDto {
  @ApiPropertyOptional({ example: 'existing-uuid-or-null' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'Updated question?' })
  @IsString()
  @MinLength(1)
  text: string;

  @ApiProperty({ enum: QuestionType, example: 'MULTIPLE_CHOICE' })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  orderIndex: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  isRequired: boolean;

  @ApiProperty({ type: [ReplaceOptionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReplaceOptionDto)
  options: ReplaceOptionDto[];
}

export class ReplaceQuestionsDto {
  @ApiProperty({ type: [ReplaceQuestionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReplaceQuestionDto)
  questions: ReplaceQuestionDto[];
}
