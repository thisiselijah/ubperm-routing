"use client";

import { useRef, useEffect } from 'react';
import { animate, createScope, createTimeline } from 'animejs';

export default function CuteHelper() {
  const root = useRef<HTMLDivElement>(null);
  const scope = useRef<any>(null);

  useEffect(() => {
    if (!root.current) return;
    
    // Check if animejs is loaded correctly, handle SSR
    if (typeof window !== 'undefined') {
        scope.current = createScope({ root: root.current }).add(() => {
        // Floating animation for the body
        animate('.cute-character', {
            translateY: [-5, 5],
            duration: 1500,
            alternate: true,
            loop: true,
            ease: 'inOutSine'
        });

        // Shadow scaling on the ground
        animate('.cute-shadow', {
            scale: [1, 0.7],
            opacity: [0.3, 0.1],
            duration: 1500,
            alternate: true,
            loop: true,
            ease: 'inOutSine'
        });

        // Blinking animation
        const blinkTl = createTimeline({ loop: true });
        blinkTl
            .add('.cute-eye', { scaleY: 0.1, duration: 100, ease: 'linear', delay: 3000 })
            .add('.cute-eye', { scaleY: 1, duration: 100, ease: 'linear' })
            .add('.cute-eye', { scaleY: 0.1, duration: 100, ease: 'linear', delay: 200 })
            .add('.cute-eye', { scaleY: 1, duration: 100, ease: 'linear' });

        // Antenna wag
        animate('.cute-antenna', {
            rotate: [-15, 15],
            duration: 800,
            alternate: true,
            loop: true,
            ease: 'inOutQuad',
            transformOrigin: 'bottom center'
        });
        
        // Cheek blush pop
        animate('.cute-blush', {
            opacity: [0, 0.8, 0],
            duration: 4000,
            loop: true,
            ease: 'inOutSine'
        });
        });
    }
    
    return () => {
      if (scope.current) scope.current.revert();
    };
  }, []);

  return (
    <div ref={root} className="mt-2 mb-6 flex justify-center items-center flex-col relative pointer-events-none">
      <div className="cute-character relative z-10 flex flex-col items-center">
        {/* Antenna */}
        <div className="cute-antenna w-1.5 h-4 bg-black dark:bg-white relative">
            <div className="absolute -top-2.5 -left-1.5 w-4 h-4 bg-[var(--color-primary)] border-2 border-black dark:border-white rounded-full"></div>
        </div>

        {/* Body */}
        <div className="w-20 h-16 bg-[var(--color-yellow-sticker)] border-2 border-black dark:border-white shadow-[4px_4px_0_#000] dark:shadow-[4px_4px_0_#fff] flex flex-col items-center justify-center relative">
          
          <div className="flex gap-5 mb-1 relative w-full justify-center">
            {/* Blushes */}
            <div className="absolute -left-1 top-2 w-3 h-2 bg-pink-500 rounded-full cute-blush opacity-0"></div>
            <div className="absolute -right-1 top-2 w-3 h-2 bg-pink-500 rounded-full cute-blush opacity-0"></div>
            
            {/* Eyes */}
            <div className="w-2 h-3 bg-black rounded-full cute-eye origin-center"></div>
            <div className="w-2 h-3 bg-black rounded-full cute-eye origin-center"></div>
          </div>
          
          {/* Mouth */}
          <div className="w-3 h-2 border-b-2 border-r-2 border-black rounded-br-full rotate-45 transform mt-1"></div>
        </div>
        
      </div>
      {/* Ground Shadow */}
      <div className="w-16 h-2 bg-black dark:bg-white rounded-[50%] cute-shadow absolute bottom-0"></div>
      
      {/* Little message */}
      <div className="mt-4 text-[10px] font-heading font-bold uppercase tracking-widest opacity-50">
        Routing Buddy
      </div>
    </div>
  );
}
