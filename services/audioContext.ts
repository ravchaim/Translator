/**
 * Singleton AudioContext to adhere to browser autoplay policies
 * and resource management.
 */

let audioContext: AudioContext | null = null;

export const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioContext = new AudioContextClass({ sampleRate: 24000 });
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
};

export const decodeAudioData = async (
  base64String: string
): Promise<AudioBuffer> => {
  const ctx = getAudioContext();
  
  // Decode base64 to binary
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Gemini returns raw PCM 24kHz mono (usually) or requires headerless decoding
  // However, the standard `decodeAudioData` often expects a container format (wav/mp3) 
  // OR we process raw PCM if we know the format.
  // The Gemini Live API docs use a manual PCM decode. 
  // The HTTP TTS endpoint often returns a container format if specified, or we assume raw PCM.
  // Based on the provided guidance code:
  // "The audio bytes returned by the API is raw PCM data."
  
  const dataInt16 = new Int16Array(bytes.buffer);
  const numChannels = 1;
  const sampleRate = 24000;
  
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
        // Convert Int16 to Float32 [-1.0, 1.0]
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }

  return buffer;
};

export const playAudioBuffer = (
  buffer: AudioBuffer,
  onEnded?: () => void,
  onVisualizerData?: (data: Uint8Array) => void
): { stop: () => void; analyser: AnalyserNode } => {
  const ctx = getAudioContext();
  const source = ctx.createBufferSource();
  const analyser = ctx.createAnalyser();
  
  source.buffer = buffer;
  
  // Connect source -> analyser -> destination
  source.connect(analyser);
  analyser.connect(ctx.destination);
  
  analyser.fftSize = 256;

  source.onended = () => {
    if (onEnded) onEnded();
  };

  source.start();

  return {
    stop: () => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Ignore if already stopped
      }
    },
    analyser
  };
};