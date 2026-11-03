import { MongooseModule, Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Review {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    ref: 'User',
  })
  user: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    ref: 'Product',
  })
  product: Types.ObjectId;

  @Prop({
    type: Number,
    required: true,
    min: 1,
    max: 5,
  })
  rating: number;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  comment: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// Changed: Prevent the same user from creating more than one
// review for the same product at the database level.
ReviewSchema.index({ user: 1, product: 1 }, { unique: true });
export type HReviewDocument = HydratedDocument<Review>;
export const ReviewModel = MongooseModule.forFeature([
  {
    name: Review.name,
    schema: ReviewSchema,
  },
]);
