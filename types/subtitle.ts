import { v4 as uuidv4 } from "uuid";

export interface Subtitle {
  uuid: string; // Unique identifier for React key and animation tracking
  id: number; // Sequential ID for SRT format
  startTime: string;
  endTime: string;
  text: string;
  oringinalText: string;
  translatedText: string;
}
