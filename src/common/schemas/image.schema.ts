import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class Image {
  @Prop({
    type: String,
    required: true,
  })
  secure_url: string;

  @Prop({
    type: String,
    required: true,
  })
  public_id: string;
}

export const imageSchema = SchemaFactory.createForClass(Image);
