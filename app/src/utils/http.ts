/**
 * fetchWithRetry
 *
 * reusable utility to perform fetch requests with exponential backoff retries.
 *
 * @param url The URL to fetch
 * @param options Fetch options (method, headers, body, etc.)
 * @param retries Max number of retries (default: 20 for robust startup handling)
 * @param backoff Multiplier for exponential delay (default: 1.5)
 * @param maxDelay Maximum delay in ms between retries (default: 3000ms)
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
                // Calculate delay: 500 * 1.5^(attempt-1), capped at maxDelay
                const calculatedDelay = 500 * Math.pow(backoff, attempt - 1);
                const delay = Math.min(calculatedDelay, maxDelay);

                // Wait before retrying
                await new Promise((resolve) => setTimeout(resolve, delay));
                return makeRequest(attempt + 1);
            }
            throw error;
        }
    };

    return makeRequest(1);
}
