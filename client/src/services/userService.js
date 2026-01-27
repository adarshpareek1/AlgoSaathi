const API_URL = `${import.meta.env.VITE_API_URL}/users`;

export const getProfileStats = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('Failed to fetch profile');
  return response.json();
};