import { MongooseModule, Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';
import { Image, imageSchema } from '../../common/schemas/image.schema.js';
import { PaymentMethod } from '../../common/enums/payment-method.enum.js';
import { PaymentStatus } from '../../common/enums/payment-status.enum.js';
import { OrderStatus } from '../../common/enums/order.enum.js';

// Order Item Schema
@Schema({ _id: false })
export class OrderItem {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    ref: 'Product',
  })
  product: Types.ObjectId;

  // Product Snapshot
  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    type: imageSchema,
    required: true,
  })
  image: Image;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  price: number;

  @Prop({
    type: Number,
    required: true,
    min: 1,
  })
  quantity: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  subtotal: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

// Shipping Address Schema
@Schema({ _id: false })
export class ShippingAddress {
  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  fullName: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  phone: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  address: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  city: string;
}

export const ShippingAddressSchema =
  SchemaFactory.createForClass(ShippingAddress);

// Coupon Snapshot Schema

@Schema({ _id: false })
export class OrderCoupon {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Coupon',
    required: true,
  })
  coupon: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  code: string;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  discountAmount: number;
}

export const OrderCouponSchema = SchemaFactory.createForClass(OrderCoupon);

// Order Schema
@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Order {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    ref: 'User',
  })
  user: Types.ObjectId;

  @Prop({
    type: [OrderItemSchema],
    required: true,
  })
  items: OrderItem[];

  @Prop({
    type: ShippingAddressSchema,
    required: true,
  })
  shippingAddress: ShippingAddress;

  @Prop({
    type: OrderCouponSchema,
    default: null,
  })
  coupon: OrderCoupon | null;
  // Pricing

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  subtotal: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
    default: 0,
  })
  shippingCost: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
    default: 0,
  })
  discount: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  total: number;

  // Payment

  @Prop({
    type: String,
    enum: Object.values(PaymentMethod),
    required: true,
  })
  paymentMethod: PaymentMethod;

  @Prop({
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  // Order Status

  @Prop({
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
  })
  orderStatus: OrderStatus;

  // Stock Management

  @Prop({
    type: Date,
    default: null,
  })
  confirmedAt?: Date;

  @Prop({
    type: Date,
    default: null,
  })
  stockDeductedAt?: Date;

  // Additional Information

  @Prop({
    type: String,
    trim: true,
    maxlength: 500,
  })
  notes?: string;

  @Prop({
    type: Date,
    default: null,
  })
  cancelledAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
export type HOrderDocument = HydratedDocument<Order>;
export const OrderModel = MongooseModule.forFeature([
  { name: Order.name, schema: OrderSchema },
]);
