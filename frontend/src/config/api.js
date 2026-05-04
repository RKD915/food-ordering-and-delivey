const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || 'https://food-ordering-and-delivey.onrender.com/api'
).replace(/\/$/, '');

export default API_BASE;
