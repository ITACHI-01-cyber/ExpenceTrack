export const apiErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;
