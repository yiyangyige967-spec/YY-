export interface ProcessedImage {
  originalData: string; // Base64
  mimeType: string;
  processedData: string | null; // Base64
}

export enum AppState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface ColorPreset {
  name: string;
  hex: string;
  promptValue: string;
}