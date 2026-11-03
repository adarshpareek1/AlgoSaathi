import { GoogleGenerativeAI } from "@google/generative-ai";

export const getAiAssistance = async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ message: "Gemini API key is not configured" });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const { code, language, context, problemStatement } = req.body; 

  if (!code && !problemStatement) {
    return res.status(400).json({ message: "Code or problem statement is required" });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let prompt = `
      You are 'AlgoSaathi', an expert Competitive Programming and DSA Tutor.
      
      User's Programming Language: ${language || 'Not specified'}
      
      ${problemStatement ? `### PROBLEM STATEMENT:\n${problemStatement}\n` : ''}
      
      ### USER'S CURRENT CODE:
      ${code || '// No code provided'}

      ### YOUR TASK (${context}):
    `;

    if (context === "explain_problem") {
      prompt += `
        The user has pasted a problem statement and wants to understand it better.
        1. Explain the problem in simple, easy-to-understand terms.
        2. Use a real-world analogy if possible.
        3. Clarify the input, output, and edge case requirements.
        4. Do NOT provide the full solution code yet. Guide their intuition first.
      `;
    } else if (context === "debug") {
      prompt += `
        Analyze the code specifically against the Problem Statement (if provided).
        Point out logical errors, edge cases where it will fail, or out-of-bounds/overflow traps.
        Keep it concise, supportive, and point directly to the lines of code that need fixing.
      `;
    } else if (context === "hint") {
      prompt += `
        Give a progressive algorithmic hint for solving the problem.
        Focus on the data structure or algorithmic paradigm needed (e.g., Two Pointers, Monotonic Stack, Dynamic Programming).
        Do NOT write full code for them; guide them to the next epiphany.
      `;
    } else if (context === "complexity") {
      prompt += `
        Perform a precise Big-O Complexity Analysis of the user's code.
        1. ⏱️ **Time Complexity**: State the worst-case Big-O (e.g. O(N log N)) and explain where it comes from (nested loops, sorting, recursion).
        2. 💾 **Space Complexity**: State the auxiliary space complexity (e.g. O(1) or O(N)) and list memory allocated (arrays, recursion call stack).
        3. 🔍 **Bottleneck**: Mention the exact line or block that dominates the runtime.
        4. 🚀 **Optimization Potential**: Can this be optimized further? If so, mention the optimal theoretical complexity.
        Keep formatting clean with clear markdown headers.
      `;
    } else {
      prompt += `Explain what the user's current code is doing line-by-line concisely and clearly.`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });

  } catch (error) {
    console.error("AI Error:", error.message);
    res.status(500).json({ message: "AlgoSaathi AI is currently unavailable. Please try again shortly." });
  }
};