import ax from 'axios';
import S from '../models/Submission.js';

export const executeCode = async (q, r) => {
  const { language: l, source: c, stdin: i } = q.body;
  const u = q.user._id;
  
  const m = { 
    cpp: { l: 'cpp17', v: '0' }, 
    c: { l: 'c', v: '4' }, 
    python: { l: 'python3', v: '3' }, 
    java: { l: 'java', v: '4' }, 
    javascript: { l: 'nodejs', v: '3' } 
  };
  
  const cfg = m[l];

  try {
    const d = await ax.post('https://api.jdoodle.com/v1/execute', {
      clientId: process.env.JDOODLE_CLIENT_ID,
      clientSecret: process.env.JDOODLE_CLIENT_SECRET,
      script: c,
      stdin: i || "",
      language: cfg.l,
      versionIndex: cfg.v
    });

    const { output: o, error: e } = d.data;
    const isErr = !!e;

    await S.create({
      user: u,
      language: l,
      code: c,
      status: isErr ? 'Error' : 'Success',
      output: (o || "").substring(0, 500)
    });

    r.json({ 
      output: o, 
      error: e, 
      code: isErr ? 1 : 0 
    });

  } catch (x) {
    console.log('x_err', x.response?.data || x.message);
    r.status(500).json({ message: 'f' });
  }
};
