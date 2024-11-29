import { ref, watch } from "vue";

export function usePhoneFormat(initialValue = "") {
  const formattedPhone = ref(initialValue);

  // Function to auto-format the phone number
  const formatPhone = () => {
    const cleaned = formattedPhone.value.replace(/\D/g, ""); // Remove all non-numeric characters
    if (cleaned.length >= 10) {
      const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
      if (match) {
        formattedPhone.value = `(${match[1]}) ${match[2]}-${match[3]}`;
      }
    }
  };

  // Watch for changes in `formattedPhone` and auto-format
  watch(formattedPhone, () => {
    formatPhone();
  });

  // Function to normalize phone input for querying the backend
  const normalizePhone = (phoneInput) => {
    return phoneInput.replace(/\D/g, ""); // Remove all non-numeric characters
  };

  return {
    formattedPhone,
    formatPhone,
    normalizePhone,
  };
}
