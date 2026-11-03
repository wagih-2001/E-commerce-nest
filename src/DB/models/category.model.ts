import { MongooseModule, Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';
import { Image, imageSchema } from '../../common/schemas/image.schema.js';
@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Category {
  @Prop({
    type: String,
    required: true,
    unique: true,
    minLength: 2,
    maxLength: 20,
    trim: true,
  })
  name: string;

  @Prop({
    type: imageSchema,
    required: true,
  })
  logo: Image;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    ref: 'User',
  })
  createdBy: Types.ObjectId;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

export type HCategoryDocument = HydratedDocument<Category>;
export const CategoryModel = MongooseModule.forFeature([
  { name: Category.name, schema: CategorySchema },
]);
