import { inject, injectable } from 'inversify';
import { Logger } from '../shared/libs/logger/index.js';
import { Component } from '../shared/types/index.js';
import { Config, RestSchema } from '../shared/libs/config/index.js';

@injectable()
export class RestApplication {

  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.Config) private readonly config: Config<RestSchema>,
  ) {

  }

  public async init() {
    this.logger.info('Application initialization');
    this.logger.info(` - PORT = ${this.config.get('PORT')}`);
    this.logger.info(` - SALT = ${this.config.get('SALT')}`);
    this.logger.info(` - DB_HOST = ${this.config.get('DB_HOST')}`);
  }
}