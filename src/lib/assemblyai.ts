import { AssemblyAI } from "assemblyai";

let client: AssemblyAI | null = null;

export function getAssemblyAIClient(): AssemblyAI {
    if (!client) {
        const apiKey = process.env.ASSEMBLYAI_API_KEY;
        if (!apiKey) {
            throw new Error(
                "ASSEMBLYAI_API_KEY is not configured. Please add it to your .env.local file."
            );
        }
        client = new AssemblyAI({ apiKey });
    }
    return client;
}
