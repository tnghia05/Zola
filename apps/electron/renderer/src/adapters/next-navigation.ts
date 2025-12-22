/**
 * Adapter to make Next.js navigation hooks work with react-router-dom in Electron
 * This file should be imported before any components that use next/navigation
 */

import { useNavigate, useLocation, useParams, useSearchParams as useSearchParamsRR } from 'react-router-dom';

// Mock useRouter to work with react-router-dom
export const useRouter = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return {
    push: (path: string) => {
      navigate(path);
    },
    replace: (path: string) => {
      navigate(path, { replace: true });
    },
    back: () => {
      navigate(-1);
    },
    forward: () => {
      navigate(1);
    },
    refresh: () => {
      window.location.reload();
    },
    pathname: location.pathname,
    query: Object.fromEntries(new URLSearchParams(location.search)),
  };
};

// Mock usePathname to work with react-router-dom
export const usePathname = () => {
  const location = useLocation();
  return location.pathname;
};

// Mock useParams to work with react-router-dom (already compatible)
export { useParams };

// Mock useSearchParams to work with react-router-dom
export const useSearchParams = () => {
  const [searchParams, setSearchParams] = useSearchParamsRR();
  
  // Create a mutable URLSearchParams-like object
  const mutableParams = new URLSearchParams(searchParams);
  
  return [
    mutableParams,
    (updater: URLSearchParams | ((prev: URLSearchParams) => URLSearchParams) | { [key: string]: string }) => {
      if (typeof updater === 'function') {
        const newParams = updater(mutableParams);
        setSearchParams(newParams);
      } else if (updater instanceof URLSearchParams) {
        setSearchParams(updater);
      } else {
        // Handle object case
        const newParams = new URLSearchParams();
        Object.entries(updater).forEach(([key, value]) => {
          newParams.set(key, value);
        });
        setSearchParams(newParams);
      }
    },
  ] as [URLSearchParams, (updater: URLSearchParams | ((prev: URLSearchParams) => URLSearchParams) | { [key: string]: string }) => void];
};

