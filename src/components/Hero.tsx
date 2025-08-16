import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const Hero: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const [videoFrames, setVideoFrames] = useState({ frame: 0 });

  const frameCount = 207;
  const currentFrame = (index: number) => {
    const framePath = `/frames/frame_${(index + 1).toString().padStart(4, '0')}.jpg`;
    return framePath;
  };

  useEffect(() => {
    // Load video frames
    const loadImages = () => {
      const imageArray: HTMLImageElement[] = [];
      let loadedCount = 0;
      let errorCount = 0;

      const onLoad = () => {
        loadedCount++;
        setImagesLoaded(loadedCount);
      };

      const onError = (index: number) => {
        errorCount++;
        loadedCount++;
        setImagesLoaded(loadedCount);
      };
      
      for (let i = 0; i < frameCount; i++) {
        const img = new Image();
        img.onload = onLoad;
        img.onerror = () => onError(i);
        img.src = currentFrame(i);
        imageArray.push(img);
      }

      setImages(imageArray);
    };

    loadImages();
  }, []);

  useEffect(() => {
    if (imagesLoaded !== frameCount || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const setCanvasSize = () => {
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * pixelRatio;
      canvas.height = window.innerHeight * pixelRatio;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      context.scale(pixelRatio, pixelRatio);
    };

    setCanvasSize();

    const setupScrollTrigger = () => {
      ScrollTrigger.create({
        trigger: '.hero',
        start: 'top top',
        end: `+=${window.innerHeight * 7}px`,
        pin: true,
        pinSpacing: true,
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;

          const animationProgress = Math.min(progress / 0.9, 1);
          const targetFrame = Math.round(animationProgress * (frameCount - 1));
          setVideoFrames({ frame: targetFrame });

          // Handle navigation opacity
          const nav = document.querySelector('nav');
          if (progress <= 0.1) {
            const navProgress = progress / 0.1;
            const opacity = 1 - navProgress;
            gsap.set(nav, { opacity });
          } else {
            gsap.set(nav, { opacity: 0 });
          }

                     if (progress <= 0.25) {
             const zProgress = progress / 0.25;
             const translateZ = zProgress * -500;

             let opacity = 1;
             if (progress >= 0.2) {
               const fadeProgress = Math.min((progress - 0.2) / (0.25 - 0.2), 1);
               opacity = 1 - fadeProgress;
             }

             gsap.set(headerRef.current, {
               transform: `translate(-50%, -50%) translateZ(${translateZ}px)`,
               opacity,
             });
           } else {
             gsap.set(headerRef.current, { opacity: 0 });
           }

           // Handle outro section animation (like the original dashboard image)
           const outro = document.querySelector('.outro');
           if (outro) {
             if (progress < 0.7) {
               gsap.set(outro, {
                 transform: 'translate(-50%, -50%) translateZ(1000px)',
                 opacity: 0,
               });
             } else if (progress >= 0.7 && progress <= 1) {
               const outroProgress = (progress - 0.7) / (1 - 0.7);
               const translateZ = 1000 - outroProgress * 1000;

               let opacity = 0;
               if (progress <= 0.85) {
                 const opacityProgress = (progress - 0.7) / (0.85 - 0.7);
                 opacity = opacityProgress;
               } else {
                 opacity = 1;
               }

               gsap.set(outro, {
                 transform: `translate(-50%, -50%) translateZ(${translateZ}px)`,
                 opacity,
               });
             } else {
               gsap.set(outro, {
                 transform: 'translate(-50%, -50%) translateZ(0px)',
                 opacity: 1,
               });
             }
           }
          },
      });
    };

    // Render first frame
    setVideoFrames({ frame: 0 });
    
    setupScrollTrigger();

    const handleResize = () => {
      setCanvasSize();
      ScrollTrigger.refresh();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [images, imagesLoaded]);

  // Separate effect to handle frame changes
  useEffect(() => {
    if (images.length > 0 && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      const render = () => {
        const canvasWidth = window.innerWidth;
        const canvasHeight = window.innerHeight;

        // Clear canvas
        context.clearRect(0, 0, canvasWidth, canvasHeight);

        const img = images[videoFrames.frame];
        
        if (img && img.complete && img.naturalWidth > 0) {
          const imageAspect = img.naturalWidth / img.naturalHeight;
          const canvasAspect = canvasWidth / canvasHeight;

          let drawWidth, drawHeight, drawX, drawY;

          if (imageAspect > canvasAspect) {
            drawHeight = canvasHeight;
            drawWidth = drawHeight * imageAspect;
            drawX = (canvasWidth - drawWidth) / 2;
            drawY = 0;
          } else {
            drawWidth = canvasWidth;
            drawHeight = drawWidth / imageAspect;
            drawX = 0;
            drawY = (canvasHeight - drawHeight) / 2;
          }

          context.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        }
      };

      render();
    }
  }, [videoFrames.frame, images]);

  return (
    <section className="hero">
      <canvas ref={canvasRef}></canvas>

      <div className="hero-content">
        <div className="header" ref={headerRef}>
          <h1>Design Engineer for Your Needs</h1>
        </div>
      </div>
    </section>
  );
};

export default Hero; 