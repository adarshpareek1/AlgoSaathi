const API_URL = `${import.meta.env.VITE_API_URL}/users`;

export const getProfileStats = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch profile stats');
  }
  return response.json();
};

export const getSubmissionsForDate = async (date) => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_URL}/submissions?date=${date}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch submissions for date');
  }
  return response.json();
};