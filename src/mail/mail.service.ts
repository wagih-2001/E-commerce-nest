import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  constructor(private readonly _mailService: MailerService) {}

  async sendVerfication(email: string, otp: string): Promise<void> {
    try {
      await this._mailService.sendMail({
        to: email,
        subject: 'Verify your email address',
        template: 'otp',
        context: {
          confirmEmailOTP: otp,
        },
      });

      this.logger.log('Verification email sent successfully');
    } catch (err) {
      this.logger.error(`Failed to send mail ${err}`);
    }
  }
}
