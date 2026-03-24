/**
 * Transforms a Cloudinary URL to include optimization parameters.
 * @param {string} url - The original Cloudinary URL.
 * @param {string} transformations - Transformation string (e.g., 'w_800,c_fill,g_auto').
 * @returns {string} - The transformed URL.
 */
export const getOptimizedImageUrl = (url, transformations = 'f_auto,q_auto') => {
  if (!url || !url.includes('cloudinary.com')) return url;
  
  // Split URL at /upload/ and insert transformations
  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;
  
  return `${parts[0]}/upload/${transformations}/${parts[1]}`;
};
