import { experimental_transcribe as transcribe } from 'ai';
import { openai } from '@ai-sdk/openai';

/**
 * Transcribe audio data to text using OpenAI's Whisper model
 * @param audioData Audio file data as Buffer, ArrayBuffer, or Uint8Array
 * @returns The transcription result with text and metadata
 */
export async function transcribeAudio(
  audioData: Buffer | ArrayBuffer | Uint8Array,
) {
  try {
    const result = await transcribe({
      model: openai.transcription('whisper-1'),
      audio: audioData,
    });

    return {
      text: result.text,
      segments: result.segments,
      language: result.language,
      durationInSeconds: result.durationInSeconds,
    };
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw new Error(
      `Failed to transcribe audio: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Transcribe audio from a URL using OpenAI's Whisper model
 * @param audioUrl URL to the audio file
 * @returns The transcription result with text and metadata
 */
export async function transcribeAudioFromUrl(audioUrl: URL) {
  try {
    const result = await transcribe({
      model: openai.transcription('whisper-1'),
      audio: audioUrl,
    });

    return {
      text: result.text,
      segments: result.segments,
      language: result.language,
      durationInSeconds: result.durationInSeconds,
    };
  } catch (error) {
    console.error('Error transcribing audio from URL:', error);
    throw new Error(
      `Failed to transcribe audio from URL: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
