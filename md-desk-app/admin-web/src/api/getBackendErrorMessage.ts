/**
 * Extract backend error message from axios error (e.g. 409 Conflict).
 * Backend sends { success: false, message: "..." }.
 */
export function getBackendErrorMessage(error: unknown, fallback = 'Operation failed'): string {
  if (error == null) return fallback;
  const err = error as { response?: { data?: { message?: string } }; message?: string };
  if (err.response?.data?.message && typeof err.response.data.message === 'string') {
    return err.response.data.message;
  }
  if (typeof err.message === 'string' && err.message) return err.message;
  return fallback;
}
