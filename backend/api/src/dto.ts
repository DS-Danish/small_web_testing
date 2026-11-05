import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class PublishSiteDto {
  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  html!: string;

  @IsString()
  @IsNotEmpty()
  authorId!: string;
}

export class CreateVisitDto {
  @IsString()
  @IsNotEmpty()
  personId!: string;

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsString()
  @IsIn([
    'typed',
    'link',
    'back',
    'forward',
    'history',
    'search',
    'publish',
  ])
  method!: string;

  @IsBoolean()
  found!: boolean;

  @IsOptional()
  @IsString()
  title?: string;
}