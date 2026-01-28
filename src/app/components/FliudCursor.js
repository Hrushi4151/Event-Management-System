'use client';
import { useEffect, useRef } from 'react';
import '../globals.css';


const FluidCursor = () => {
  const cursorRef = useRef(null);
  const tailRefs = useRef([]);
  const positions = useRef([]);

  const TAIL_LENGTH = 10;

  useEffect(() => {
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const animate = () => {
      // Insert current mouse position at the beginning
      positions.current.unshift({ x: mouseX, y: mouseY });

      // Keep only TAIL_LENGTH positions
      if (positions.current.length > TAIL_LENGTH) {
        positions.current.pop();
      }

      // Move each tail circle to its corresponding position
      tailRefs.current.forEach((circle, i) => {
        if (positions.current[i]) {
          circle.style.transform = `translate3d(${positions.current[i].x}px, ${positions.current[i].y}px, 0)`;
        }
      });

      requestAnimationFrame(animate);
    };

    document.addEventListener('mousemove', handleMouseMove);
    animate();

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <>
      <div id="cursor">
        {[...Array(TAIL_LENGTH)].map((_, i) => (
          <div
            key={i}
            className="cursor-circle"
            ref={(el) => (tailRefs.current[i] = el)}
          />
        ))}
      </div>

      <svg style={{ position: 'absolute' }}>
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 20 -10"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </svg>
    </>
  );
};

export default FluidCursor;
