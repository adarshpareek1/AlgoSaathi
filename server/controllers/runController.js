import axios from 'axios';
import Submission from '../models/Submission.js';

export const executeCode = async (req, res) => {
  const PISTON_API = process.env.PISTON_API_URL;

  const { language, source, stdin } = req.body;
  const userId = req.user._id; 
  const languageMap = {
    cpp: 'c++', c: 'c', python: 'python', java: 'java', javascript: 'javascript'
  };
  
  const runtimeLanguage = languageMap[language];

  try {
    const response = await axios.post(PISTON_API, {
      language: runtimeLanguage,
      version: "*",
      files: [{ content: source }],
      stdin: stdin || "",
    });

    const { run } = response.data;
    const output = run.stdout || run.stderr;
    const isError = !!run.stderr;

    await Submission.create({
      user: userId,
      language,
      code: source,
      status: isError ? 'Error' : 'Success',
      output: output.substring(0, 500)
    });

    res.json({
      output: run.stdout,
      error: run.stderr,
      code: run.code
    });

  } catch (error) {
    res.status(500).json({ message: "Execution Failed" });
  }
};