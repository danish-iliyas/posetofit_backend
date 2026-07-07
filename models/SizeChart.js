import mongoose from 'mongoose';

const SizeEntrySchema = new mongoose.Schema(
  {
    label: { type: String, required: true }, // e.g. 'S', 'M', 'L', 'XL'
    chestMinCm: Number,
    chestMaxCm: Number,
    waistMinCm: Number,
    waistMaxCm: Number,
  },
  { _id: false }
);

const SizeChartSchema = new mongoose.Schema(
  {
    brand: { type: String, required: true, index: true }, // e.g. 'Zara', 'Generic'
    gender: { type: String, enum: ['men', 'women'], required: true, index: true },
    category: { type: String, enum: ['tops', 'bottoms'], required: true },
    sizes: [SizeEntrySchema],
  },
  { timestamps: true }
);

SizeChartSchema.index({ brand: 1, gender: 1, category: 1 }, { unique: true });

export default mongoose.models.SizeChart || mongoose.model('SizeChart', SizeChartSchema);
