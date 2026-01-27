const API_URL = `${import.meta.env.VITE_API_URL}/ai`;

export const askAi = async (code, language, context, problemStatement = "") => {
  const response = await fetch(`${API_URL}/assist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, language, context, problemStatement }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'AI failed');
  return data.reply; 
};