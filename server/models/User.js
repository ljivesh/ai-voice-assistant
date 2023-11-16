// user.js

import { Schema, model } from 'mongoose';
import { genSalt, hash, compare } from 'bcrypt';

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6, // You can adjust the minimum length as needed
  },
});

// Hash the password before saving it to the database
userSchema.pre('save', async function (next) {
  try {
    const salt = await genSalt(10);
    const hashedPassword = await hash(this.password, salt);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords during login
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Static method to find a user by email
userSchema.statics.findByEmail = async function (email) {
  try {
    return await this.findOne({ email });
  } catch (error) {
    throw error;
  }
};

const UserModel = model('User', userSchema);

export default UserModel;
