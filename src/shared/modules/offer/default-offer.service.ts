import { inject, injectable } from 'inversify';
import { OfferService } from './offer-service.interface.js';
import { Component } from '../../types/index.js';
import { Logger } from '../../libs/logger/index.js';
import { DocumentType, types } from '@typegoose/typegoose';
import { OfferEntity } from './offer.entity.js';
import { CreateOfferDto } from './dto/create-offer.dto.js';
import { DeleteResult } from 'mongoose';
import { UpdateOfferDto } from './dto/update-offer.dto.js';
import { CommentEntity } from '../comment/comment.entity.js';
import { UserEntity } from '../user/user.entity.js';


@injectable()
export class DefaultOfferService implements OfferService {
  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.OfferModel) private readonly offerModel: types.ModelType<OfferEntity>,
    @inject(Component.CommentModel) private readonly commentModel: types.ModelType<CommentEntity>,
    @inject(Component.UserModel) private readonly userModel: types.ModelType<UserEntity>,
  ) {}

  public async create(dto: CreateOfferDto): Promise<DocumentType<OfferEntity>> {
    const result = await this.offerModel.create(dto);
    this.logger.info(`New offer created: ${dto.name}`);

    return result;
  }

  public async findById(offerId: string): Promise<DocumentType<OfferEntity> | null> {
    return this.offerModel
      .findById(offerId)
      .exec();
  }

  public async find(): Promise<DocumentType<OfferEntity>[]> {
    return this.offerModel
      .find({})
      .exec();
  }

  public async deleteById(offerId: string): Promise<DeleteResult> {
    return this.offerModel.deleteOne({ _id: offerId }).exec();
  }

  public async updateById(offerId: string, dto: UpdateOfferDto): Promise<DocumentType<OfferEntity> | null> {
    return this.offerModel
      .findOneAndUpdate({ _id: offerId }, dto, { new: true });
  }

  public async findPremiumByCity(cityName: string): Promise<DocumentType<OfferEntity>[]> {
    return this.offerModel
      .find({'city.name': cityName, isPremium: true})
      .exec();
  }

  public async incCommentCount(offerId: string): Promise<void> {
    await this.offerModel
      .updateOne({offerId: offerId}, {$inc: { commentsCount: 1 }})
      .exec();
  }

  public async recalculateRating(offerId: string): Promise<void> {
    const avgRatingResult = await this.commentModel
      .aggregate([
        {
          $match: {
            offerId: offerId
          }
        },
        {
          $group: {
            _id: '$offerId',
            avgRating: { $avg: '$rating' }
          }
        },
      ])
      .exec();
    const avgRating = avgRatingResult[0].avgRating;
    const setNewRating = { $set: { rating : avgRating } };
    await this.offerModel.findByIdAndUpdate({ offerId: offerId }, setNewRating);
  }

  public async exists(documentId: string): Promise<boolean> {
    return (await this.offerModel
      .exists({_id: documentId})) !== null;
  }

  public async findFavorite(userId: string): Promise<DocumentType<OfferEntity>[]> {
    const offers = await this.offerModel
      .find({ favoriteByUsers: userId })
      .exec();
    return offers;
  }

  public async addToFavorite(offerId: string, userId: string): Promise<void> {
    await this.offerModel
      .updateOne({ _id: offerId }, {$addToSet: { favoriteByUsers: userId }})
      .exec();
    await this.userModel
      .updateOne({ _id: userId }, {$addToSet: { favoriteOffers: offerId }})
      .exec();
  }

  public async deleteFromFavorite(offerId: string, userId: string): Promise<void> {
    await this.offerModel
      .updateOne({ _id: offerId }, {$pull: { favoriteByUsers: userId }})
      .exec();
    await this.userModel
      .updateOne({ _id: userId }, {$pull: { favoriteOffers: offerId }})
      .exec();
  }
}
