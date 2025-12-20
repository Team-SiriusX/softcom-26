/**
 * Gemini AI Client for Financial Simulator
 * Handles AI parsing and verdict generation
 */

import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import type { Scenario, AIVerdict } from "../state/simulator-state";

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_GEMINI_API_KEY environment variable is required");
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.2, // Lower for consistent financial reasoning
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });
  }

  /**
   * Parse natural language query to structured scenario
   */
  async parseQuery(prompt: string): Promise<Scenario> {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log("🤖 Raw Gemini parseQuery response:", text);

      const parsed = this.parseJsonSafely(text);
      
      console.log("✅ Successfully parsed to JSON:", parsed);

      return this.validateScenario(parsed);
    } catch (error) {
      console.error("❌ Gemini parseQuery error:", error);
      throw new Error(`Failed to parse query: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Generate AI verdict with reasoning
   */
  async generateVerdict(prompt: string): Promise<AIVerdict> {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log("🤖 Raw Gemini verdict response:", text);

      const verdict = this.parseJsonSafely(text);

      console.log("✅ Successfully parsed verdict to JSON:", verdict);

      // Validate verdict structure
      if (!verdict.analysis || !verdict.reasoning || !verdict.recommendation) {
        throw new Error("Invalid verdict structure from Gemini - missing required fields");
      }

      return {
        analysis: verdict.analysis,
        reasoning: Array.isArray(verdict.reasoning) ? verdict.reasoning : [verdict.reasoning],
        recommendation: verdict.recommendation,
        confidence: verdict.confidence || 0.8,
      };
    } catch (error) {
      console.error("❌ Gemini generateVerdict error:", error);
      throw new Error(`Failed to generate verdict: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Clean JSON response from Gemini (remove markdown, fix formatting)
   * Aggressively repairs common JSON issues
   */
  private cleanJsonResponse(text: string): string {
    let cleaned = text.trim();

    // Step 1: Remove markdown code blocks
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\s*/g, "").replace(/```\s*$/g, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/g, "").replace(/```\s*$/g, "");
    }

    // Step 2: Extract JSON object/array if embedded in text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }

    // Step 3: Remove control characters and normalize whitespace
    cleaned = cleaned
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control chars
      .replace(/\r\n/g, " ") // Replace CRLF with space
      .replace(/\n/g, " ") // Replace LF with space
      .replace(/\r/g, " ") // Replace CR with space
      .replace(/\t/g, " ") // Replace tabs with space
      .replace(/\s+/g, " ") // Normalize multiple spaces
      .trim();

    // Step 4: Fix common JSON syntax issues
    cleaned = cleaned
      // Remove trailing commas before closing braces/brackets
      .replace(/,(\s*[}\]])/g, "$1")
      // Fix single quotes to double quotes (for property names)
      .replace(/'([^']*?)'\s*:/g, '"$1":')
      // Ensure property names are quoted
      .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
      // Fix unescaped quotes in string values (heuristic: replace internal quotes)
      .replace(/:\s*"([^"]*)"([^",}]*?)"/g, (match, p1, p2) => {
        // If p2 contains characters that shouldn't be there, it's likely an unescaped quote
        if (p2.trim().length > 0) {
          return `: "${p1}${p2.replace(/"/g, '\\"')}"`;
        }
        return match;
      });

    // Step 5: Try to balance brackets/braces if unbalanced
    const openBraces = (cleaned.match(/\{/g) || []).length;
    const closeBraces = (cleaned.match(/\}/g) || []).length;
    const openBrackets = (cleaned.match(/\[/g) || []).length;
    const closeBrackets = (cleaned.match(/\]/g) || []).length;

    // Add missing closing brackets/braces
    if (openBraces > closeBraces) {
      cleaned += "}".repeat(openBraces - closeBraces);
    }
    if (openBrackets > closeBrackets) {
      cleaned += "]".repeat(openBrackets - closeBrackets);
    }

    return cleaned;
  }

  /**
   * Ultra-robust JSON parser with multiple fallback strategies
   */
  private parseJsonSafely(text: string): any {
    // Strategy 1: Try direct parse
    try {
      return JSON.parse(text);
    } catch (e1) {
      console.warn("⚠️ Direct parse failed, trying cleanup...");
    }

    // Strategy 2: Try with cleanup
    try {
      const cleaned = this.cleanJsonResponse(text);
      return JSON.parse(cleaned);
    } catch (e2) {
      console.warn("⚠️ Cleaned parse failed, trying aggressive repair...");
    }

    // Strategy 3: Aggressive repair - fix unterminated strings
    try {
      let repaired = this.cleanJsonResponse(text);
      
      // Find unterminated strings and close them
      const stringPattern = /"[^"]*$/gm;
      repaired = repaired.replace(stringPattern, (match) => match + '"');
      
      // Ensure all colons are followed by values
      repaired = repaired.replace(/:\s*([,}])/g, ': ""$1');
      
      console.log("🔧 Aggressively repaired:", repaired);
      return JSON.parse(repaired);
    } catch (e3) {
      console.error("❌ All parse strategies failed");
      throw new Error(`JSON parse failed after all attempts: ${e3 instanceof Error ? e3.message : "Unknown error"}`);
    }
  }

  /**
   * Validate scenario structure
   */
  private validateScenario(scenario: any): Scenario {
    const validTypes = [
      "hire",
      "fire",
      "price_increase",
      "price_decrease",
      "new_client",
      "lose_client",
      "investment",
      "expense",
    ];

    if (!scenario.type || !validTypes.includes(scenario.type)) {
      throw new Error(`Invalid scenario type: ${scenario.type}`);
    }

    if (typeof scenario.startMonthsAgo !== "number" || scenario.startMonthsAgo < 0 || scenario.startMonthsAgo > 5) {
      throw new Error(`Invalid startMonthsAgo: ${scenario.startMonthsAgo}`);
    }

    if (typeof scenario.probability !== "number" || scenario.probability < 0 || scenario.probability > 1) {
      throw new Error(`Invalid probability: ${scenario.probability}`);
    }

    return {
      type: scenario.type,
      startMonthsAgo: scenario.startMonthsAgo,
      monthlyCost: scenario.monthlyCost || 0,
      monthlyRevenue: scenario.monthlyRevenue || 0,
      oneTimeCost: scenario.oneTimeCost || 0,
      growthFactor: scenario.growthFactor || 0,
      probability: scenario.probability,
      description: scenario.description || "No description provided",
    };
  }

  /**
   * Retry logic with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;

        const delay = baseDelay * Math.pow(2, i);
        console.log(`Retry attempt ${i + 1}/${maxRetries} after ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw new Error("Max retries exceeded");
  }
}
