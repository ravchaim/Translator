export enum PlaybackState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
}

export interface AudioData {
  buffer: AudioBuffer;
}

export enum Language {
  HEBREW = 'Hebrew',
  ENGLISH = 'English',
  FRENCH = 'French',
  SPANISH = 'Spanish',
}

export interface TranslationState {
  sourceText: string;
  translatedText: string;
  isTranslating: boolean;
  error: string | null;
}