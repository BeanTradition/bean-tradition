
import { GoogleGenAI } from "@google/genai";
import { Product } from '../types';

// Initialize the Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getCoffeeRecommendation = async (
  preferences: string, 
  products: Product[]
): Promise<string> => {
  try {
    const productListString = products.map(p => 
      `- ${p.name}: ${p.description} (Category: ${p.category}, Roast: ${p.roast}, Intensity: ${p.intensity}/5, Tags: ${p.tags.join(', ')})`
    ).join('\n');

    const prompt = `
      You are "Caffeine Ai", the intelligent virtual barista for "Bean Tradition".
      The customer has shared their preferences: "${preferences}".
      
      Here is our curated collection:
      ${productListString}
      
      Based on the customer's preferences, recommend ONE or TWO best-fitting products from our menu.
      Your tone should be knowledgeable, warm, and sophisticated. Use words like "notes", "body", "finish".
      
      Note: 
      - If they want something quick or easy, suggest Instant Coffee.
      - If they like traditional south indian style, suggest Filter Coffee Powder.
      - If they have a grinder or want fresh brew, suggest Robusta or Arabica Beans.

      Keep the response short (under 80 words).
      Do not make up products. Only use the ones provided.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "I recommend our Arabica Coffee Beans. They never disappoint!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Our roasters are currently busy. Please explore our collection below.";
  }
};
