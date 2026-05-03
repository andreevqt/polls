import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  IsBoolean,
  IsInt,
  Min,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Visibility, QuestionType } from '@prisma/client';

export class CreateOptionDto {
  @ApiProperty({ example: 'Red' })
  @IsString()
  @MinLength(1)
  text: string;

  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  orderIndex: number;
}

export class CreateQuestionDto {
  @ApiProperty({ example: 'What is your favorite color?' })
  @IsString()
  @MinLength(1)
  text: string;

  @ApiProperty({ enum: QuestionType, example: 'SINGLE_CHOICE' })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  orderIndex: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  isRequired: boolean;

  @ApiProperty({ type: [CreateOptionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  options: CreateOptionDto[];
}

export class CreatePollDto {
  @ApiProperty({ example: 'Favorite Color?' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Choose your favorite' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: Visibility, example: 'PUBLIC' })
  @IsEnum(Visibility)
  visibility: Visibility;

  @ApiPropertyOptional({ example: '2025-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiProperty({ type: [CreateQuestionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  @ArrayMinSize(1)
  questions: CreateQuestionDto[];
}
