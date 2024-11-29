export function formatPhoneNumber(phoneNo) {
  if (phoneNo.length === 10) {
    return `(${phoneNo.slice(0, 3)}) ${phoneNo.slice(3, 6)}-${phoneNo.slice(
      6
    )}`;
  }
  return phoneNo; // Return as-is if not 10 digits
}
