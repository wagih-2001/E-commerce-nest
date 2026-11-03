import { MongooseModule, Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';

import { Image, imageSchema } from '../../common/schemas/image.schema.js';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Product {
  @Prop({
    type: String,
    required: true,
    unique: true,
    minLength: 2,
    maxLength: 100,
    trim: true,
  })
  name: string;

  @Prop({
    type: String,
    required: true,
    minLength: 10,
    maxLength: 500,
    trim: true,
  })
  description: string;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  price: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
    default: 0,
  })
  stock: number;

  @Prop({
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  })
  discount: number;

  @Prop({
    type: [imageSchema],
    required: true,
  })
  images: Image[];

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    ref: 'Category',
  })
  category: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    ref: 'Brand',
  })
  brand: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    ref: 'User',
  })
  createdBy: Types.ObjectId;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
export type HProductDocument = HydratedDocument<Product>;
export const ProductModel = MongooseModule.forFeature([
  {
    name: Product.name,
    schema: ProductSchema,
  },
]);
