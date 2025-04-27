import { useEffect, useRef, useState } from 'react';

export const useIntersectionObserver = (options) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [options]);

  return [ref, isIntersecting];
};

export const LazyLoadWrapper = ({ children, rootMargin = '0px', threshold = 0 }) => {
  const [ref, isIntersecting] = useIntersectionObserver({
    rootMargin,
    threshold
  });

  return (
    <div ref={ref}>
      {isIntersecting ? children : null}
    </div>
  );
};