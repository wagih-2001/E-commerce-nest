import { MongooseModule, Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';
import { Image, imageSchema } from '../../common/schemas/image.schema.js';

@Schema({
  _id: false,
})
export class CartItem {
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
  })
  quantity: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  pricePerUnit: number;
  @Prop({
    type: Number,
    required: true,
    min: 1,
  })
  subTotal: number;
}

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Cart {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    unique: true,
    ref: 'User',
  })
  user: Types.ObjectId;

  @Prop({
    type: [CartItem],
    required: true,
    default: [],
  })
  items: CartItem[];

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  totalPrice: number;
}

export const CartSchema = SchemaFactory.createForClass(Cart);

export type HCartDocument = HydratedDocument<Cart>;
export const CartModel = MongooseModule.forFeature([
  { name: Cart.name, schema: CartSchema },
]);
