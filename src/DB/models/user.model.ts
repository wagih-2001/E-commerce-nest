import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { GenderEnum, RoleEnum } from '../../common/enums/user.enum.js';
import { HydratedDocument } from 'mongoose';
import { hash } from '../../common/security/hash.js';
import { Image, imageSchema } from '../../common/schemas/image.schema.js';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class User {
  @Prop({
    type: String,
    required: true,
    minLength: 2,
    maxLength: 20,
    trim: true,
  })
  firstName: string;

  @Prop({
    type: String,
    required: true,
    minLength: 2,
    maxLength: 20,
    trim: true,
  })
  lastName: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  })
  email: string;

  @Prop({
    type: Date,
  })
  confirmEmail: Date;

  @Prop({
    type: String,
  })
  confirmEmailOTP?: string;

  @Prop({
    type: Date,
  })
  OTPExpiresAt?: Date;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  password: string;
  @Prop({
    type: String,
    enum: {
      values: Object.values(GenderEnum),
      message: `{VALUE} Gender is not valid`,
    },
    default: GenderEnum.MALE,
  })
  gender: string;

  @Prop({
    type: String,
    enum: {
      values: Object.values(RoleEnum),
      message: `{VALUE} Gender is not valid`,
    },
    default: RoleEnum.USER,
  })
  role: string;

  @Prop({
    type: imageSchema,
  })
  profilePic?: Image;

  @Prop({
    type: imageSchema,
  })
  coverPic?: Image;
}

export const userSchema = SchemaFactory.createForClass(User);

userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await hash(this.password);
  }
});

userSchema
  .virtual('username')
  .get(function (this: any) {
    return `${this.firstName} ${this.lastName}`;
  })
  .set(function (this: any, value: string) {
    const [firstName, lastName] = value.split(' ');
    this.firstName = firstName;
    this.lastName = lastName;
  });

export type HUserDocument = HydratedDocument<User>;
export const UserModel = MongooseModule.forFeature([
  { name: User.name, schema: userSchema },
]);
