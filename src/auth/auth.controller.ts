import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { CreateAuthDto } from './dto/create-auth.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { ResendOtpDto } from './dto/resend-otp.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from '../common/utils/multer.utils.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() createAuthDto: CreateAuthDto) {
    const user = await this.authService.signup(createAuthDto);
    return {
      success: true,
      message: 'Account created successfully',
      data: user,
    };
  }

  @Patch('verify-email')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return await this.authService.verifyEmail(verifyEmailDto);
  }

  @Patch('resend-otp')
  async resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    return await this.authService.resendOtp(resendOtpDto);
  }
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  async getProfile(@Request() request: any) {
    return {
      success: true,
      message: 'Profile fetched successfully',
      data: request.user,
    };
  }
  @Patch('profile-pic')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadProfilePic(
    @UploadedFile() file: Express.Multer.File,
    @Request() request: any,
  ) {
    const userId = request.user._id;

    const updateUser = await this.authService.saveProfilePic(userId, file);

    return {
      success: true,
      message: 'Profile image updated successfully',
      user: updateUser,
    };
  }
}
