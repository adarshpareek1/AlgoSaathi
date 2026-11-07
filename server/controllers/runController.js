import Submission from '../models/Submission.js';
import { runCodeEngine } from '../services/executionService.js';

/**
 * Controller to execute user code with retry, exponential backoff,
 * dynamic timeout and fallback execution engine.
 */
export const executeCode = async (req, res) => {
  const { language, source, stdin = '' } = req.body;
  const userId = req.user._id;

  if (!language || !source) {
    return res.status(400).json({
      success: false,
      message: 'Language and source code are required.'
    });
  }

  try {
    // Execute code via our resilient engine
    const executionResult = await runCodeEngine({
      language,
      source,
      stdin
    });

    const isError = executionResult.code !== 0 || !!executionResult.error;

    // Save record to database
    const submissionRecord = await Submission.create({
      user: userId,
      language,
      code: source,
      status: isError ? 'Error' : 'Success',
      output: (executionResult.output || executionResult.error || '').substring(0, 2000)
    });

    return res.status(200).json({
      success: true,
      output: executionResult.output,
      error: executionResult.error,
      code: executionResult.code,
      executionTimeMs: executionResult.executionTimeMs,
      engine: executionResult.engine,
      attempts: executionResult.attempts,
      submissionId: submissionRecord._id
    });

  } catch (error) {
    console.error('Code execution failed:', error.message);

    // Save failed submission to database
    await Submission.create({
      user: userId,
      language,
      code: source,
      status: 'Error',
      output: `System execution error: ${error.message}`.substring(0, 500)
    }).catch(err => console.error('Failed to save error submission:', err.message));

    return res.status(500).json({
      success: false,
      message: error.message || 'Execution failed due to internal compiler service error',
      error: error.message,
      code: 1
    });
  }
};
