import mongoose from 'mongoose';
import SizeChart from '../models/SizeChart.js';

// Only verified data points found via web search are included. Missing sizes
// (e.g. Zara S/XXL, Levi's L) were not found from a reliable source and are
// deliberately left out rather than guessed -- add them once you have the
// brand's real chart instead of interpolating.
const CHARTS = [
  {
    brand: 'Generic',
    gender: 'men',
    category: 'tops',
    sizes: [
      { label: 'S', chestMinCm: 88, chestMaxCm: 93 },
      { label: 'M', chestMinCm: 94, chestMaxCm: 99 },
      { label: 'L', chestMinCm: 100, chestMaxCm: 105 },
      { label: 'XL', chestMinCm: 106, chestMaxCm: 111 },
      { label: 'XXL', chestMinCm: 112, chestMaxCm: 117 },
    ],
  },
  {
    brand: 'Zara',
    gender: 'men',
    category: 'tops',
    sizes: [
      { label: 'M', chestMinCm: 94, chestMaxCm: 98 },
      { label: 'L', chestMinCm: 99, chestMaxCm: 103 },
      { label: 'XL', chestMinCm: 104, chestMaxCm: 108 },
    ],
  },
  {
    brand: 'H&M',
    gender: 'men',
    category: 'tops',
    sizes: [{ label: 'M', chestMinCm: 96, chestMaxCm: 102 }],
  },
  {
    brand: 'Roadster',
    gender: 'men',
    category: 'tops',
    sizes: [
      { label: 'S', chestMinCm: 96.5, chestMaxCm: 96.5 },
      { label: 'M', chestMinCm: 101.6, chestMaxCm: 101.6 },
      { label: 'L', chestMinCm: 106.7, chestMaxCm: 106.7 },
      { label: 'XL', chestMinCm: 111.8, chestMaxCm: 111.8 },
      { label: 'XXL', chestMinCm: 116.8, chestMaxCm: 116.8 },
    ],
  },
  {
    brand: "Levi's",
    gender: 'men',
    category: 'tops',
    sizes: [
      { label: 'M', chestMinCm: 97, chestMaxCm: 102 },
      { label: 'XL', chestMinCm: 112, chestMaxCm: 117 },
    ],
  },
  {
    brand: "Levi's",
    gender: 'men',
    category: 'bottoms',
    sizes: [
      { label: 'W32', waistMinCm: 81, waistMaxCm: 84 },
      { label: 'W34', waistMinCm: 86, waistMaxCm: 89 },
    ],
  },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing MONGODB_URI in environment');

  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || 'PoseToFit' });

  for (const chart of CHARTS) {
    await SizeChart.findOneAndUpdate(
      { brand: chart.brand, gender: chart.gender, category: chart.category },
      chart,
      { upsert: true, new: true }
    );
    console.log(`Seeded ${chart.brand} / ${chart.gender} / ${chart.category}`);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
