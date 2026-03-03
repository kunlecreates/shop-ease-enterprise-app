'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

const slides = [
  {
    src: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=2070&q=80',
    alt: 'Colourful grocery superstore interior with fresh produce and shelves',
  },
  {
    src: 'https://images.unsplash.com/photo-1601600576337-c1d8a0d1373c?auto=format&fit=crop&w=2070&q=80',
    alt: 'Vibrant fruit and beverage display in a large supermarket aisle',
  },
  {
    src: 'https://images.unsplash.com/photo-1556767576-cf0a4a80e5b8?auto=format&fit=crop&w=2070&q=80',
    alt: 'Wide grocery superstore aisle stretching into the distance',
  },
  {
    src: 'https://images.unsplash.com/photo-1769257984317-1ba900cc623e?auto=format&fit=crop&w=2070&q=80',
    alt: 'Large grocery superstore exterior with trees under a clear sky',
  },
];

const INTERVAL_MS = 10000;
const FADE_MS = 1500;

export default function HeroSlideshow() {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % slides.length);
        setFading(false);
      }, FADE_MS);
    }, INTERVAL_MS);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {slides.map((slide, i) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          fill
          priority={i === 0}
          unoptimized
          className="object-cover object-center transition-opacity duration-[1500ms]"
          style={{ opacity: i === current ? (fading ? 0 : 1) : 0 }}
          sizes="100vw"
        />
      ))}
    </>
  );
}
