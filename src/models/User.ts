import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: 'member' | 'superadmin';
  createdAt: Date;
  updatedAt: Date;
  // Virtual field for contacts
  contacts?: any[];
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['member', 'superadmin'],
      default: 'member',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field to get all contacts created by this user
UserSchema.virtual('contacts', {
  ref: 'Contact',
  localField: '_id',
  foreignField: 'owner',
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
