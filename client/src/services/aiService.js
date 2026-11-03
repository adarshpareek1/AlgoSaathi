const API_URL = `${import.meta.env.VITE_API_URL}/ai`;

export const askAi = async (code, language, context, problemStatement = "") => {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/assist`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ code, language, context, problemStatement }),
  });

  const data = await response.json();
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(`Rate limit reached: ${data.message || 'Please wait before asking the AI again.'}`);
    }
    throw new Error(data.message || 'AI request failed');
  }
  return data.reply; 
};