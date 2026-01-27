const API_URL = `${import.meta.env.VITE_API_URL}/run`;

export const runCode = async (language, source, stdin = "") => {
  const token = localStorage.getItem('token'); // Get Token

  const response = await fetch(`${API_URL}/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Send Token
    },
    body: JSON.stringify({ language, source, stdin }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Execution failed');
  return data;
};