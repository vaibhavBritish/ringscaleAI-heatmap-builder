'use client';

import React from 'react';

const logos = [
  '/marquee/dynamicsecurity.png',
  '/marquee/holyshakes.png',
  '/marquee/indespice.jpeg',
  '/marquee/logo-MOC-Off-white1.png',
  '/marquee/northerntadka.png',
  '/marquee/uniconnectpro.png',
];

const LogoMarquee = () => {
  // Duplicate logos for seamless loop
  const displayLogos = [...logos, ...logos, ...logos, ...logos];

  return (
    <div className="w-full py-12 bg-white overflow-hidden relative mt-10">
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-10" />
      
      <div className="flex animate-marquee hover:pause-on-hover gap-16 items-center whitespace-nowrap">
        {displayLogos.map((logo, index) => (
          <div key={index} className="flex-shrink-0   transition-all duration-300 ">
            <img 
              src={logo} 
              alt={`Partner Logo ${index}`} 
              className="h-10 md:h-12 w-auto object-contain max-w-[150px]"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogoMarquee;
