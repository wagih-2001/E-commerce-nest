import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { ReviewService } from './review.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import type { Request as ExpressRequest } from 'express';
import { Types } from 'mongoose';

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('create-review')
  @UseGuards(AuthGuard)
  create(
    @Body() createReviewDto: CreateReviewDto,
    @Request() request: ExpressRequest,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('Unauthorized user');
    }
    const userId = request.user._id;
    return this.reviewService.create(createReviewDto, userId);
  }

  @Get()
  findAll() {
    return this.reviewService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewService.findOne(id);
  }

  @Patch('update-review/:id')
  @UseGuards(AuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @Request() request: ExpressRequest,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('Unauthorized user');
    }
    const userId = request.user?._id as Types.ObjectId;

    return this.reviewService.update(id, updateReviewDto, userId);
  }

  @Delete('delete-review/:id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string, @Request() request: ExpressRequest) {
    // 1. Check if the user is authenticated
    if (!request.user) {
      throw new UnauthorizedException('Unauthorized user');
    }

    // 2. Get the current user id from JWT
    const userId = request.user._id as Types.ObjectId;

    // 3. Delete only if the review belongs to this user
    return this.reviewService.remove(id, userId);
  }
}
