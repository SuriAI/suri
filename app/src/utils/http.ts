/**
 * Reusable utility to perform fetch requests with exponential backoff retries.
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries: number = 20,
  backoff: number = 1.5,
  maxDelay: number = 3000,
): Promise<Response> {
  const makeRequest = async (attempt: number): Promise<Response> => {
    try {
      return await fetch(url, options);
    } catch (error) {
      // Only retry on network errors (fetch failure)
      if (
        error instanceof TypeError &&
        error.message === "Failed to fetch" &&
        attempt <= retries
      ) {
        const calculatedDelay = 500 * Math.pow(backoff, attempt - 1);
        const delay = Math.min(calculatedDelay, maxDelay);

        await new Promise((resolve) => setTimeout(resolve, delay));
        return makeRequest(attempt + 1);
      }
      throw error;
    }
  };

  return makeRequest(1);
}
