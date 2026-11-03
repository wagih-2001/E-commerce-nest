import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto.js';
import { InjectModel } from '@nestjs/mongoose';
import { HUserDocument, User } from '../DB/models/user.model.js';
import { Model } from 'mongoose';
import { hash } from '../common/security/hash.js';
import { MailService } from '../mail/mail.service.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { compare } from 'bcrypt';
import { ResendOtpDto } from './dto/resend-otp.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { TokenService } from '../common/services/token.js';
import { CloudinaryService } from '../common/services/cloudinary.js';
import { RoleEnum } from '../common/enums/user.enum.js';
import cloudinary from '../config/cloudinary.config.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly _userModel: Model<HUserDocument>,
    private readonly _mailService: MailService,
    private readonly _tokenService: TokenService,
    private readonly _cloudinaryService: CloudinaryService,
  ) {}

  async signup(createAuthDto: CreateAuthDto): Promise<HUserDocument> {
    // Find Email if exists
    const existingUser = await this._userModel.findOne({
      email: createAuthDto.email,
    });

    if (existingUser) {
      throw new Error('An account with this email already exists');
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await hash(otp);

    const expirIn = new Date();

    // Date now + 5 minutes
    expirIn.setMinutes(expirIn.getMinutes() + 5);

    const newUser = await this._userModel.create({
      ...createAuthDto,
      confirmEmailOTP: hashedOtp,
      OTPExpiresAt: expirIn,
    });

    const saveUser = await newUser.save();

    // Send email
    await this._mailService.sendVerfication(saveUser.email, otp);

    return saveUser;
  }

  async verifyEmail(
    verifyEmailDto: VerifyEmailDto,
  ): Promise<{ message: string }> {
    const user = await this._userModel.findOne({
      email: verifyEmailDto.email,
    });

    if (!user) {
      throw new NotFoundException('Not Account found with this email');
    }

    // Check if email is already verified
    if (user.confirmEmail) {
      throw new BadRequestException('Email already verified');
    }

    // Check if OTP exists
    if (!user.confirmEmailOTP) {
      throw new BadRequestException('OTP is missing');
    }

    // Check if OTP expiration date exists
    if (!user.OTPExpiresAt) {
      throw new BadRequestException('OTP expiration date is missing');
    }

    // Check if OTP is expired
    if (user.OTPExpiresAt < new Date()) {
      throw new BadRequestException('OTP has expired');
    }

    // Check if OTP is valid
    if (
      !(await compare(verifyEmailDto.confirmEmailOTP, user.confirmEmailOTP))
    ) {
      throw new BadRequestException('Invalid OTP');
    }

    // Verify email
    user.confirmEmail = new Date();

    // Remove OTP after successful verification
    user.confirmEmailOTP = undefined;
    user.OTPExpiresAt = undefined;

    await user.save();

    return {
      message: 'Email verified successfully',
    };
  }

  async resendOtp(resendOtpDto: ResendOtpDto): Promise<{ message: string }> {
    const user = await this._userModel.findOne({
      email: resendOtpDto.email,
    });

    if (!user) {
      throw new NotFoundException('Not Account found with this email');
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await hash(otp);

    const newExpirIn = new Date();

    // Date now + 1 minute
    newExpirIn.setMinutes(newExpirIn.getMinutes() + 1);

    user.confirmEmailOTP = hashedOtp;
    user.OTPExpiresAt = newExpirIn;

    await user.save();

    await this._mailService.sendVerfication(user.email, otp);

    return {
      message: 'Email verified successfully',
    };
  }

  async login(loginDto: LoginDto): Promise<{
    message: string;
    accessToken: string;
    refreshToken: string;
  }> {
    // Find User
    const user = await this._userModel.findOne({
      email: loginDto.email,
      confirmEmail: { $exists: true },
    });

    if (!user) {
      throw new NotFoundException('User Not Found with this email');
    }

    // Compare Password
    const isPasswordValid = await compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid Email or Password');
    }

    // Generate Access + Refresh Tokens
    const { accessToken, refreshToken } =
      await this._tokenService.generateToken(user._id, user.role as RoleEnum);

    return {
      message: 'Login successful',
      accessToken,
      refreshToken,
    };
  }

  async saveProfilePic(
    userId: string,
    file: Express.Multer.File,
  ): Promise<HUserDocument> {
    // Find User
    const user = await this._userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User Not Found');
    }
    const uploadImage = await this._cloudinaryService.replaceImage(
      file.buffer,
      user.profilePic?.public_id,
      'ecommerce/users/profile',
    );

    // Save Cloudinary data in MongoDB
    user.profilePic = uploadImage;

    await user.save();

    return user;
  }
}
