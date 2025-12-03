import { ColorPreset } from './types';

export const COLOR_PRESETS: ColorPreset[] = [
  { name: 'Classic Red', hex: '#DC2626', promptValue: 'vibrant classic red' },
  { name: 'Navy Blue', hex: '#1E3A8A', promptValue: 'deep navy blue' },
  { name: 'Emerald Green', hex: '#059669', promptValue: 'rich emerald green' },
  { name: 'Pastel Pink', hex: '#FBCFE8', promptValue: 'soft pastel pink' },
  { name: 'Gold', hex: '#F59E0B', promptValue: 'metallic gold' },
  { name: 'Silver', hex: '#9CA3AF', promptValue: 'metallic silver' },
  { name: 'Black', hex: '#000000', promptValue: 'matte black' },
  { name: 'White', hex: '#FFFFFF', promptValue: 'pure white' },
];

export const MAX_FILE_SIZE_MB = 5;
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];