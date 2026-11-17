import { MongooseModule, Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Coupon {
  @Prop({
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  })
  code: string;

  @Prop({
    type: Number,
    required: true,
    min: 1,
    max: 100,
  })
  discountPercentage: number;

  @Prop({
    type: Number,
    min: 1,
  })
  usageLimit?: number;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  usageCount: number;

  @Prop({
    type: [MongooseSchema.Types.ObjectId],
    ref: 'User',
    default: [],
  })
  usedBy: Types.ObjectId[];

  @Prop({
    type: Date,
    required: true,
  })
  startDate: Date;

  @Prop({
    type: Date,
    required: true,
  })
  expiryDate: Date;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive: boolean;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  createdBy: Types.ObjectId;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);

export type HCouponDocument = HydratedDocument<Coupon>;

export const CouponModel = MongooseModule.forFeature([
  { name: Coupon.name, schema: CouponSchema },
]);
