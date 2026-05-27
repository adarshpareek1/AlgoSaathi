import ax from 'axios';
import S from '../models/Submission.js';

export const executeCode = async (q, r) => {
  const { language: l, source: c, stdin: i } = q.body;
  const u = q.user._id;
  
  const m = { cpp: 54, c: 50, python: 71, java: 62, javascript: 93 };
  const id = m[l];

  try {
    const p = 'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true';
    const o = {
      headers: {
        'x-rapidapi-key': process.env.JUDGE0_API_KEY,
        'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
        'Content-Type': 'application/json'
      }
    };

    const d = await ax.post(p, {
      language_id: id,
      source_code: c,
      stdin: i || ""
    }, o);

    const { stdout: so, stderr: se, compile_output: co } = d.data;
    const err = se || co;
    const out = so || err || "";
    const isErr = !!err;

    await S.create({
      user: u,
      language: l,
      code: c,
      status: isErr ? 'Error' : 'Success',
      output: out.substring(0, 500)
    });

    r.json({ 
      output: so, 
      error: err, 
      code: 0 
    });

  } catch (x) {
    console.log('x_err', x.response?.data || x.message);
    r.status(500).json({ message: 'f' });
  }
};
