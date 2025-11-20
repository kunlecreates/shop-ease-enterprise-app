import { IsString, Length, IsNumber, Min, IsOptional, IsArray, ArrayNotEmpty } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @Length(3, 50)
  sku!: string;

  @IsString()
  @Length(2, 120)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  categoryCodes?: string[];
}