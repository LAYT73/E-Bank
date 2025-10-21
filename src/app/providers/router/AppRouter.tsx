import { AnimatePresence, m, LazyMotion, domAnimation } from 'framer-motion';
import { Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

import { LoadingPage } from '@/pages';

import { routeConfig } from './routeConfig';

export const AppRouter = () => (
  <BrowserRouter>
    <AnimatedSuspenseRoutes />
  </BrowserRouter>
);

const AnimatedSuspenseRoutes = () => {
  const [minDelayPassed, setMinDelayPassed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinDelayPassed(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return <Suspense fallback={<LoadingPage />}>{minDelayPassed ? <AnimatedRoutes /> : <LoadingPage />}</Suspense>;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence mode="wait">
        <Routes key={location.pathname} location={location}>
          {routeConfig.map(({ path, element }) => (
            <Route
              key={path}
              path={path}
              element={
                <m.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="min-h-full min-w-full"
                >
                  {element}
                </m.div>
              }
            />
          ))}
        </Routes>
      </AnimatePresence>
    </LazyMotion>
  );
};
