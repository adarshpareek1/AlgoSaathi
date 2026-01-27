import { GoogleGenerativeAI } from "@google/generative-ai";

export const getAiAssistance = async (req, res) => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  const { code, language, context, problemStatement } = req.body; 

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let prompt = `
      You are 'AlgoSaathi', an expert Competitive Programming Tutor.
      
      User's Language: ${language}
      
      ${problemStatement ? `### PROBLEM STATEMENT:\n${problemStatement}\n` : ''}
      
      ### USER'S CODE:
      ${code}

      ### YOUR TASK (${context}):
    `;

    if (context === "explain_problem") {
       prompt += `
         The user has pasted a problem statement and wants to understand it better.
         1. Explain the problem in simple, easy-to-understand terms.
         2. Use a real-world analogy if possible.
         3. Clarify the input and output requirements.
         4. Do NOT provide the code solution. Just explain the logic.
       `;
    } else if (context === "debug") {
      prompt += `
        Analyze the code specifically against the Problem Statement above (if provided).
        Point out logical errors where the code fails to meet the problem requirements.
        Keep it concise.
      `;
    } else if (context === "hint") {
      prompt += `
        Give a progressive hint to solve the Problem Statement above.
        Focus on the algorithm or data structure needed (e.g., "Consider using a Hash Map").
        Do NOT write the code for them.
      `;
    } else {
      prompt += `Explain what the user's current code is doing line-by-line.`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });

  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ message: "AlgoSaathi is sleeping (AI Error)" });
  }
};