import { IsString, Length, IsNumber, Min, IsOptional, IsArray, IsInt } from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceCents?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @Length(0, 50)
  aisle?: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  section?: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  shelfLocation?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryCodes?: string[];
}
