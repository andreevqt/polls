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

  @ApiPropertyOptional({ example: 'option-uuid' })
  @IsOptional()
  @IsUUID()
  optionId?: string;

  @ApiPropertyOptional({ example: 'My comment' })
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
