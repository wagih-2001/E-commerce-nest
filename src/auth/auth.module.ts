import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { UserModel } from '../DB/models/user.model.js';
import { MailModule } from '../mail/mail.module.js';
import { TokenService } from '../common/services/token.js';
import { JwtService } from '@nestjs/jwt';
import { CloudinaryService } from '../common/services/cloudinary.js';

@Module({
  imports: [UserModel, MailModule],
  controllers: [AuthController],
  providers: [AuthService, TokenService, JwtService, CloudinaryService],
})
export class AuthModule {}
