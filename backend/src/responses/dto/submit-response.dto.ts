import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitAnswerDto {
  @ApiProperty({ example: 'question-uuid' })
  @IsUUID()
  questionId: string;

  @ApiPropertyOptional({ example: 'option-uuid', description: 'For SINGLE_CHOICE questions' })
  @IsOptional()
  @IsUUID()
  optionId?: string;

  @ApiPropertyOptional({
    example: ['option-uuid-1', 'option-uuid-2'],
    description: 'For MULTIPLE_CHOICE questions — list of selected option IDs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  optionIds?: string[];

  @ApiPropertyOptional({ example: 'My comment', description: 'For TEXT questions' })
  @IsOptional()
  @IsString()
  textValue?: string;
}

export class SubmitResponseDto {
  @ApiProperty({ type: [SubmitAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerDto)
  answers: SubmitAnswerDto[];

  @ApiPropertyOptional({ example: 'browser-fingerprint-hash' })
  @IsOptional()
  @IsString()
  respondentFingerprint?: string;
}
