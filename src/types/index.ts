export interface Utterance {
    speaker: string;
    text: string;
    start: number;
    end: number;
}

export interface TranscriptionResult {
    utterances: Utterance[];
    speakerMap: Record<string, string>; // e.g. { "A": "Hablante 1", "B": "Hablante 2" }
}

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

export interface SummaryResponse {
    summary: string;
}

export interface ChatResponse {
    answer: string;
}
