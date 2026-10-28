import { useEffect, useState } from 'react';

/* True on phone-width screens. Used where a layout genuinely changes shape
   rather than just reflowing — one clip per row instead of two, say — which
   CSS alone can't express because the row structure also drives the autoplay
   scrolling. */
export function useNarrow(query = '(max-width: 860px)') {
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (e) => setNarrow(e.matches);
    setNarrow(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return narrow;
}
