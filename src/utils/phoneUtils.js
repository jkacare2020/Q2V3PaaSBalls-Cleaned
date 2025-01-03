/**
 * Formats a phone number to (xxx) xxx-xxxx
 * @param {string} phone - The raw phone number (can include non-numeric characters).
 * @returns {string} - The formatted phone number or original input if invalid.
 */
export function formatPhoneNumber(phone) {
  const cleaned = phone.replace(/\D/g, ""); // Remove non-numeric characters
  if (cleaned.length === 10) {
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone; // Return unformatted if input is invalid
}

/**
 * Validates if a phone number is in the format (xxx) xxx-xxxx
 * @param {string} phone - The phone number to validate.
 * @returns {boolean} - True if valid, false otherwise.
 */
export function isValidPhoneNumber(phone) {
  return /^\(\d{3}\) \d{3}-\d{4}$/.test(phone);
}
