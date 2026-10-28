import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRoute, go } from './utils/useRoute.js';
import GiftBox from './components/GiftBox.jsx';
import Hub from './components/Hub.jsx';
import Messages from './pages/Messages.jsx';
import Cinema from './pages/Cinema.jsx';

/* Slow out, no bounce — the whole point is that it reads as one continuous
   lift rather than a cut between two screens. */
/* The gift sinks away and the hub comes down from above, so the eye travels
   upward with the balloons rather than down past them. */
const FLOAT = { duration: 1.3, ease: [0.22, 1, 0.36, 1] };

const PAGES = { messages: Messages, cinema: Cinema };

export default function App() {
  const route = useRoute();
  const [rising, setRising] = useState(false);

  if (route === 'landing') {
    return (
      <>
        <div className="relative h-full overflow-hidden">
          <motion.div
            className="absolute inset-0"
            animate={{ y: rising ? '100%' : '0%' }}
            transition={FLOAT}
          >
            <GiftBox onOpen={() => setRising(true)} />
          </motion.div>

          <motion.div
            className="absolute inset-0"
            initial={{ y: '-100%' }}
            animate={{ y: rising ? '0%' : '-100%' }}
            transition={FLOAT}
            onAnimationComplete={() => {
              if (rising) {
                go('hub');
                setRising(false);
              }
            }}
          >
            <Hub />
          </motion.div>
        </div>
      </>
    );
  }

  if (route === 'hub') {
    return (
      <>
        <motion.div
          className="h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
        >
          <Hub />
        </motion.div>
      </>
    );
  }

  const Page = PAGES[route];
  return (
    <>
      <motion.div
        className="min-h-full"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <Page />
      </motion.div>
    </>
  );
}
