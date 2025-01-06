import type { Logger } from 'winston';
import { config } from '@core/config';
import { logger } from '@core/logger';

export class ServiceBase {
  public log: Logger = logger;
  public config = config;
}
