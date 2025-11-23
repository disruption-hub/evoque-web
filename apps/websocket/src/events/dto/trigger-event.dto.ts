import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class TriggerEventDto {
  @IsString()
  @IsNotEmpty()
  channel: string;

  @IsString()
  @IsNotEmpty()
  event: string;

  @IsObject()
  @IsOptional()
  data?: any;
}

