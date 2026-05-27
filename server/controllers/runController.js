import ax from 'axios';
import S from '../models/Submission.js';

export const executeCode = async (q, r) => {
  const p = process.env.PISTON_API_URL || 'https://emkc.org/api/v2/piston/execute';
  const { language: l, source: c, stdin: i } = q.body;
  const u = q.user._id;
  
  const m = { cpp: 'c++', c: 'c', python: 'python', java: 'java', javascript: 'javascript' };
  const rt = m[l];

  try {
    const d = await ax.post(p, {
      language: rt,
      version: "*",
      files: [{ content: c }],
      stdin: i || "",
    });

    const { run: rn } = d.data;
    const o = rn.stdout || rn.stderr;
    const e = !!rn.stderr;

    await S.create({
      user: u,
      language: l,
      code: c,
      status: e ? 'Error' : 'Success',
      output: o.substring(0, 500)
    });

    r.json({ output: rn.stdout, error: rn.stderr, code: rn.code });
  } catch (x) {
    console.log('x_err', x.response?.data || x.message);
    r.status(500).json({ message: 'f' });
  }
};
