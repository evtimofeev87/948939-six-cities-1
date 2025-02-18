import { OfferType, Amenities, User, City } from '../../../types/index.js';
import {
  IsOptional,
  IsMongoId,
  IsLatitude,
  IsLongitude,
  IsString,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  Min,
  Max,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize
} from 'class-validator';
import { OfferMessage } from './offer.messages.js';

export class UpdateOfferDto {

  @IsOptional()
  @IsString()
  @MinLength(10, { message: OfferMessage.title.minLength })
  @MaxLength(100, { message: OfferMessage.title.maxLength })
  public name?: string;

  @IsOptional()
  @IsString()
  @MinLength(20, { message: OfferMessage.description.minLength })
  @MaxLength(1024, { message: OfferMessage.description.maxLength })
  public description?: string;

  @IsOptional()
  public city?: City;

  @IsOptional()
  @IsString()
  public previewImage?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(6)
  @ArrayMaxSize(6)
  @IsString({each: true})
  public images?: string[];

  @IsOptional()
  @IsBoolean()
  public isPremium?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: OfferMessage.rating.minValue })
  @Max(5, { message: OfferMessage.rating.maxValue })
  public rating?: number;

  @IsOptional()
  @IsEnum(OfferType, { message: OfferMessage.type.invalid })
  public type?: OfferType;

  @IsOptional()
  @IsInt({ message: OfferMessage.roomsCount.invalidFormat })
  @Min(1, { message: OfferMessage.roomsCount.minValue })
  @Max(8, { message: OfferMessage.roomsCount.maxValue })
  public roomsCount?: number;

  @IsOptional()
  @IsInt({ message: OfferMessage.guestsCount.invalidFormat })
  @Min(1, { message: OfferMessage.guestsCount.minValue })
  @Max(10, { message: OfferMessage.guestsCount.maxValue })
  public guestsCount?: number;

  @IsOptional()
  @IsInt({ message: OfferMessage.price.invalidFormat })
  @Min(100, { message: OfferMessage.price.minValue })
  @Max(100000, { message: OfferMessage.price.maxValue })
  public price?: number;

  @IsOptional()
  @IsArray({ message: OfferMessage.amenities.notArray })
  @IsEnum(Amenities, { each: true, message: OfferMessage.amenities.invalid })
  public amenities?: Amenities[];

  @IsOptional()
  @IsMongoId()
  public userId?: User;

  @IsOptional()
  @IsInt({ message: OfferMessage.commentsCount.invalidFormat })
  public commentsCount?: number;

  @IsOptional()
  @IsLatitude()
  public latitude?: number;

  @IsOptional()
  @IsLongitude()
  public longitude?: number;
}
