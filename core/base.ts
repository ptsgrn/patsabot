import type { Logger } from 'winston';
import { config } from '@core/config';
import { logger } from '@core/logger';
import chalk from 'chalk';

export class ServiceBase {
  public log: Logger = logger;
  public config = config;
}

export class Input extends ServiceBase {
  /**
   * Prompt the user for some input from choices
   * @param message Question to ask
   * @param choices Choices to choose from
   * @returns User's choice from one of the choices
   */
  public prompt(message: string, choices: string[] = ['y', 'n']) {
    while (true) {
      const question = "> " + message + " (" + choices.join('/') + "): ";
      this.log.debug(question)
      const answer = prompt(chalk.yellowBright(question))?.toLowerCase();
      this.log.debug('User input: ' + answer);
      if (answer && choices.includes(answer)) {
        return answer;
      } else {
        this.log.warn("Invalid input. Please try again.");
      }
    }
  }

  /**
   * Confirm a question with the user
   * @param message Question to confirm
   * @returns True if user confirms, false otherwise
   */
  public confirm(message: string) {
    return this.prompt(message, ['y', 'n']) === 'y';
  }

  /**
   * Ask the user for some input
   * @param message Question to ask
   * @returns User's input
   */
  public ask(message: string) {
    return prompt("> " + message);
  }
}