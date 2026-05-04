import { useCallback, useMemo, useState } from 'react';
import axiosInstance from '../api/axiosInstance';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (method, url, body, config) => {
    setLoading(true);
    setError(null);
    try {
      const res = body !== undefined
        ? await axiosInstance[method](String(url), body, config)
        : await axiosInstance[method](String(url), config);
      return res.data;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Request failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const methods = useMemo(() => ({
    get: (url, config) => request('get', url, undefined, config),
    post: (url, body, config) => request('post', url, body ?? {}, config),
    put: (url, body, config) => request('put', url, body ?? {}, config),
    patch: (url, body, config) => request('patch', url, body ?? {}, config),
    del: (url, config) => request('delete', url, undefined, config),
    delete: (url, config) => request('delete', url, undefined, config),
  }), [request]);

  return { loading, error, ...methods };
}

export default useApi;
