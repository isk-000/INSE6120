export const summaryPrompt = (prompt: string) => `You are an AI privacy policy analyzer. Analyze the following privacy policy based on the criteria below:
    1. Summarize the privacy policy in 2-3 sentences.
### Privacy Policy Content: 
${prompt}
`;

export const scorePrompt = (chunk: string) => `Analyze the following privacy policy chunk and provide a detailed analysis:Chunk:${chunk}`;

export const CLARITY = "Clarity";
export const TRANSPARENCY = "Transparency";
export const ACCESSIBILITY = "Accessibility";
export const SECURITY = "Security";
export const COMPREHENSIVENESS = "Comprehensiveness";
export const OVERALL_SCORE = "Overall Score";

export const CATEGORIES_MAPPING: {[key:string]: string} = {
    "LABEL_0": CLARITY,
    "LABEL_1": TRANSPARENCY,
    "LABEL_2": ACCESSIBILITY,
    "LABEL_3": SECURITY,
    "LABEL_4": COMPREHENSIVENESS
};

export const CATEGORY_TO_EMOJI : {[key:number]: string} = {
    1 : "🟥",
    2 : "🟧",
    3 : "🟨",
    4 : "🟦",
    5 : "🟩"
};