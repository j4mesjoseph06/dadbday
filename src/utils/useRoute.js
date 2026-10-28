import { useEffect, useState } from 'react';

/* A hash router in fifteen lines, because four screens don't justify a
   dependency. Hash routing also means a refresh while building keeps you on
   the page you were working on instead of dumping you back at the gift box. */

export const ROUTES = ['landing', 'hub', 'messages', 'cinema'];

function read() {
  const h = window.location.hash.replace(/^#\/?/, '');
  return ROUTES.includes(h) ? h : 'landing';
}

export function useRoute() {
  const [route, setRoute] = useState(read);

  useEffect(() => {
    const onChange = () => setRoute(read());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}

export function go(route) {
  window.location.hash = `/${route}`;
}
