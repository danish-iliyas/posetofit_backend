import mongoose from 'mongoose';

const MeasurementsSchema = new mongoose.Schema(
  {
    shoulderCm: Number,
    chestCm: Number,
    waistCm: Number,
    hipCm: Number,
    mode: { type: String, enum: ['quick', 'accurate'] },
    estimatedAt: Date,
  },
  { _id: false }
);

const ProfileSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    gender: { type: String, enum: ['men', 'women'], required: true },
    heightCm: { type: Number, required: true },
    measurements: MeasurementsSchema,
  },
  { timestamps: true }
);

export default mongoose.models.Profile || mongoose.model('Profile', ProfileSchema);
