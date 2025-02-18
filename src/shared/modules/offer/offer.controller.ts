import {
  BaseController,
  DocumentExistsMiddleware,
  HttpMethod,
  PrivateRouteMiddleware, UploadFileMiddleware,
  ValidateDtoMiddleware,
  ValidateObjectIdMiddleware,
} from '../../libs/rest/index.js';
import { StatusCodes } from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { Component } from '../../types/index.js';
import { Logger } from '../../libs/logger/index.js';
import { Request, Response } from 'express';
import { OfferService } from './offer-service.interface.js';
import { fillDTO } from '../../helpers/index.js';
import { OfferRdo } from './rdo/offer.rdo.js';
import { CommentService } from '../comment/index.js';
import { CreateOfferDto } from './dto/create-offer.dto.js';
import { ParamsDictionary } from 'express-serve-static-core';
import { UpdateOfferDto } from './dto/update-offer.dto.js';
import { Config, RestSchema } from '../../libs/config/index.js';
import { UploadImageRdo } from './rdo/upload-image.rdo.js';
import { HttpError } from '../../libs/rest/index.js';

type ParamOfferId = {
  offerId: string;
} | ParamsDictionary;

type ParamCityName = {
  cityName: string;
} | ParamsDictionary;

@injectable()
export default class OfferController extends BaseController {
  constructor(
    @inject(Component.Logger) protected logger: Logger,
    @inject(Component.OfferService) private readonly offerService: OfferService,
    @inject(Component.CommentService) private readonly commentService: CommentService,
    @inject(Component.Config) private readonly configService: Config<RestSchema>,
  ) {
    super(logger);

    this.logger.info('Register routes for OfferController');

    this.addRoute({
      path: '/premium/:city',
      method: HttpMethod.Get,
      handler: this.getPremiumOffersByCity,
    });
    this.addRoute({
      path: '/favorite',
      method: HttpMethod.Get,
      handler: this.getFavorite,
    });
    this.addRoute({
      path: '/favorite/:offerId',
      method: HttpMethod.Post,
      handler: this.addFavorite,
      middlewares: [
        new ValidateObjectIdMiddleware('offerId'),
        new DocumentExistsMiddleware(this.offerService, 'Offer', 'offerId')
      ]
    });
    this.addRoute({
      path: '/favorite/:offerId',
      method: HttpMethod.Delete,
      handler: this.deleteFavorite,
      middlewares: [
        new ValidateObjectIdMiddleware('offerId'),
        new DocumentExistsMiddleware(this.offerService, 'Offer', 'offerId')
      ]
    });
    this.addRoute({
      path: '/',
      method: HttpMethod.Post,
      handler: this.createOffer,
      middlewares: [
        new PrivateRouteMiddleware(),
        new ValidateDtoMiddleware(CreateOfferDto)
      ]
    });
    this.addRoute({
      path: '/',
      method: HttpMethod.Get,
      handler: this.getOffers,
    });
    this.addRoute({
      path: '/:offerId',
      method: HttpMethod.Get,
      handler: this.getOneOffer,
      middlewares: [
        new ValidateObjectIdMiddleware('offerId'),
        new DocumentExistsMiddleware(this.offerService, 'Offer', 'offerId')
      ]
    });
    this.addRoute({
      path: '/:offerId',
      method: HttpMethod.Patch,
      handler: this.updateOneOffer,
      middlewares: [
        new PrivateRouteMiddleware(),
        new ValidateDtoMiddleware(UpdateOfferDto),
        new ValidateObjectIdMiddleware('offerId'),
        new DocumentExistsMiddleware(this.offerService, 'Offer', 'offerId')
      ]
    });
    this.addRoute({
      path: '/:offerId',
      method: HttpMethod.Delete,
      handler: this.deleteOneOffer,
      middlewares: [
        new PrivateRouteMiddleware(),
        new ValidateObjectIdMiddleware('offerId'),
        new DocumentExistsMiddleware(this.offerService, 'Offer', 'offerId')
      ]
    });
    this.addRoute({
      path: '/:offerId/image',
      method: HttpMethod.Post,
      handler: this.uploadImage,
      middlewares: [
        new PrivateRouteMiddleware(),
        new ValidateObjectIdMiddleware('offerId'),
        new UploadFileMiddleware(this.configService.get('UPLOAD_DIRECTORY'), 'image'),
      ]
    });
  }

  public async createOffer({ body, tokenPayload }: Request<unknown, unknown, CreateOfferDto>, res: Response<OfferRdo>): Promise<void> {
    const newOffer = await this.offerService.create({...body, userId: tokenPayload.id});
    this.created(res, fillDTO(OfferRdo, newOffer));
  }

  public async getOffers(_req: Request, res: Response<OfferRdo[]>): Promise<void> {
    const offers = await this.offerService.find();
    this.ok(res, fillDTO(OfferRdo, offers));
  }

  public async getOneOffer({ params }: Request<ParamOfferId>, res: Response): Promise<void> {
    const { offerId } = params;
    const offer = await this.offerService.findById(offerId);
    this.ok(res, fillDTO(OfferRdo, offer));
  }

  public async deleteOneOffer({ params, tokenPayload }: Request<ParamOfferId>, res: Response): Promise<void> {
    const { offerId } = params;
    const offer = await this.offerService.findById(offerId);

    if (offer?.userId._id.toString() !== tokenPayload.id) {
      throw new HttpError(
        StatusCodes.NOT_FOUND,
        'Offer ont found',
        'OfferController'
      );
    }

    await this.offerService.deleteById(offerId);

    await this.commentService.deleteByOfferId(offerId);
    this.noContent(res, offer);
  }

  public async updateOneOffer({ params, body, tokenPayload }: Request<ParamOfferId, CreateOfferDto>, res: Response): Promise<void> {
    const { offerId } = params;
    const offer = await this.offerService.findById(offerId);

    if (offer?.userId._id.toString() !== tokenPayload.id) {
      throw new HttpError(
        StatusCodes.NOT_FOUND,
        'Offer ont found',
        'OfferController'
      );
    }
    await this.offerService.updateById(offerId, body);
    this.ok(res, fillDTO(OfferRdo, offer));
  }

  public async getPremiumOffersByCity({ params }: Request<ParamCityName>, res: Response): Promise<void> {
    const { cityName } = params;
    const offer = await this.offerService.findPremiumByCity(cityName);
    this.ok(res, fillDTO(OfferRdo, offer));
  }

  public async getFavorite({ tokenPayload }: Request, res: Response): Promise<void> {
    const offers = await this.offerService.findFavorite(tokenPayload.id);
    this.ok(res, fillDTO(OfferRdo, offers));
  }

  public async addFavorite({ params, tokenPayload }: Request, res: Response): Promise<void> {
    await this.offerService.addToFavorite(params.offerId, tokenPayload.id);
    this.ok(res, {});
  }

  public async deleteFavorite({ params, tokenPayload }: Request, res: Response): Promise<void> {
    await this.offerService.deleteFromFavorite(params.offerId, tokenPayload.id);
    this.ok(res, {});
  }

  public async uploadImage({ params, file } : Request<ParamOfferId>, res: Response) {
    const { offerId } = params;
    const updateDto = { previewImage: file?.filename };
    await this.offerService.updateById(offerId, updateDto);
    this.created(res, fillDTO(UploadImageRdo, updateDto));
  }
}
