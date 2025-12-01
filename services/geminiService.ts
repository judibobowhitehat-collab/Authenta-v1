import { GoogleGenAI } from "@google/genai";
import { RewriteMode } from "../types";

// SAFELY ACCESS API KEY (Fixes "process is not defined" error in browser)
const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
const ai = new GoogleGenAI({ apiKey: apiKey });

const MODELS = {
  TEXT: 'gemini-2.5-flash',
};

export const rewriteText = async (text: string, mode: RewriteMode): Promise<string> => {
  let systemInstruction = "You are an expert editor.";
  
  switch (mode) {
    case 'creative':
      systemInstruction = "You are a creative writer. Rewrite the text to be more engaging, vivid, and original. Avoid clichés.";
      break;
    case 'grammar':
      systemInstruction = "You are a strict proofreader. Fix all grammar, spelling, and punctuation errors. Improve flow but keep the tone neutral.";
      break;
    case 'professional':
      systemInstruction = "You are a corporate communications expert. Rewrite the text to be professional, concise, and suitable for a business environment.";
      break;
    case 'academic':
      systemInstruction = "You are an academic scholar. Rewrite the text to be formal, objective, and suitable for research papers.";
      break;
    case 'auto-correct':
      // Strict instruction for auto-correct as requested
      systemInstruction = "You are a precise auto-correct engine. Your ONLY task is to fix spelling, grammar, punctuation, and typo errors in the provided text. Do NOT change the style, tone, vocabulary, or sentence structure. Preserve the original meaning exactly. Return ONLY the corrected text. Do not add markdown or explanations.";
      break;
    case 'business-pitch':
      systemInstruction = "You are a Venture Capital consultant. Rewrite this idea into a compelling business pitch. Focus on value proposition, problem/solution fit, and market potential. Use persuasive language.";
      break;
    case 'technical-plan':
      systemInstruction = "You are a Senior CTO. Convert this idea into a high-level technical implementation plan. Outline the architecture, technology stack, and key modules needed to build it.";
      break;
    case 'market-ready':
      systemInstruction = "You are a Marketing Director. Rewrite this text to be 'Market Ready'. Focus on benefits over features, use catchy headlines, and make it sound like a launched product description.";
      break;
  }

  try {
    const response = await ai.models.generateContent({
      model: MODELS.TEXT,
      contents: `Please process the following text according to your instructions:\n\n${text}`,
      config: {
        systemInstruction: systemInstruction,
        // 0.0 temperature makes it deterministic and focused solely on the "nearest suggestion" for errors
        temperature: mode === 'auto-correct' ? 0.0 : 0.7, 
      },
    });

    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini Rewrite Error:", error);
    throw new Error("Failed to process text. Please try again.");
  }
};

export const checkGrammar = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODELS.TEXT,
      contents: `Analyze the following text for grammar, spelling, and punctuation errors. 
      
      Return a JSON object (without markdown code blocks) with this structure:
      {
        "score": number (0-100),
        "issues": [
          { "type": "spelling" | "grammar" | "punctuation", "original": string, "suggestion": string, "explanation": string }
        ],
        "correctedText": string
      }
      
      Text: "${text}"`,
      config: {
        responseMimeType: "application/json"
      }
    });

    return response.text || "{}";
  } catch (error) {
    console.error("Gemini Grammar Error:", error);
    throw new Error("Failed to check grammar.");
  }
};

export const classifyCopyright = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODELS.TEXT,
      contents: `Analyze the following text and suggest the most appropriate Copyright License (e.g., CC0, CC-BY, All Rights Reserved, Public Domain). 
      
      Provide a structured analysis:
      1. Detected Content Type (e.g., Code, Creative Writing, Technical Doc).
      2. Recommended License.
      3. Reasoning.
      
      Text to analyze: "${text.substring(0, 1000)}..."`, 
      config: {
        systemInstruction: "You are a legal expert specializing in Intellectual Property and Copyright Law.",
      },
    });

    return response.text || "Could not classify text.";
  } catch (error) {
    console.error("Gemini Classify Error:", error);
    throw new Error("Failed to classify copyright.");
  }
};

export const suggestInventionImprovements = async (title: string, description: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODELS.TEXT,
      contents: `Analyze the following invention idea and suggest 5 innovative features, potential market applications, or technical improvements.
      
      Invention Title: ${title}
      Description: ${description}
      
      Format the output as a clean markdown list with bold headers for each suggestion.`,
      config: {
        systemInstruction: "You are a Product R&D Expert and Innovation Consultant. Your goal is to help inventors expand their ideas.",
        temperature: 0.8
      }
    });
    return response.text || "No suggestions available.";
  } catch (error) {
    console.error("Gemini Suggest Error:", error);
    throw new Error("Failed to generate suggestions.");
  }
};