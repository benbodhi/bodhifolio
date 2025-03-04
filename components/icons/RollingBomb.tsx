"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const RollingBomb = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const radius = 45; // From SVG circle
    const circumference = 2 * Math.PI * radius; // 282.74
    const screenWidth = window.innerWidth;
    const centerX = screenWidth / 2 - 52.5; // Center of screen minus half of SVG width
    
    // Calculate distances
    const distanceToRight = screenWidth - centerX + 105; // Distance from center to right edge + SVG width
    const distanceFromLeftToCenter = centerX + 105; // Distance from left edge to center + SVG width
    
    // Calculate rotations (complete rotations for clean alignment)
    const rotationsToRight = Math.ceil(distanceToRight / circumference);
    const rotationsToCenterFromLeft = Math.ceil(distanceFromLeftToCenter / circumference);
    
    const rotationToRight = rotationsToRight * 360; // Complete rotations in degrees
    const rotationFromLeftToCenter = rotationsToCenterFromLeft * 360; // Complete rotations in degrees
    
    // Reset position
    gsap.set(svgRef.current, { 
      x: centerX,
      rotation: 0,
      transformOrigin: "45px 50px"
    });
    
    // Create a timeline
    const tl = gsap.timeline({ repeat: -1 });
    
    // Start with a pause in the center
    tl.to(svgRef.current, { duration: 3, x: centerX, rotation: 0 })
    
      // Slow start to backward spin with slight leftward movement
      .to(svgRef.current, {
        rotation: -45, // Full backward rotation
        x: centerX - 30, // Move left
        duration: 0.8,
        ease: "power2.inOut" // Smooth acceleration and deceleration
      })
      
      // Brief pause at maximum backward rotation
      .to(svgRef.current, {
        rotation: -45,
        x: centerX - 30, // Hold position
        duration: 0.2,
        ease: "none" // No easing, just hold
      })
      
      // Smooth transition directly from backward position to forward roll
      .to(svgRef.current, {
        rotation: 0,
        x: centerX, // Back to center
        duration: 0.5,
        ease: "power3.out" // Strong acceleration out of the backward position
      })
    
      // Roll to the right and off screen
      .to(svgRef.current, {
        x: screenWidth + 105,
        rotation: rotationToRight,
        duration: 4,
        ease: "linear"
      })
      
      // Instantly move to left side off screen
      .set(svgRef.current, { 
        x: -105,
        rotation: 0 // Reset rotation for the return journey
      })
      
      // Roll from left to center
      .to(svgRef.current, {
        x: centerX,
        rotation: rotationFromLeftToCenter,
        duration: 4,
        ease: "linear",
        onComplete: function() {
          // Immediately set rotation to 0 to prevent backward spin
          gsap.set(svgRef.current, { rotation: 0 });
        }
      })
      
      // Pause in the center again (without changing rotation)
      .to(svgRef.current, { duration: 0.5, x: centerX });

  }, []);

  return (
    <div 
      ref={containerRef}
      className="absolute bottom-0 left-0 w-full overflow-visible pointer-events-none z-50"
      style={{ height: '100px' }}
    >
      <svg 
        ref={svgRef} 
        width="105" 
        height="95" 
        viewBox="0 0 105 95" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ 
          position: 'absolute',
          bottom: 0,
          left: 0,
          transform: 'translateY(-5px)', // Position the outer edge of the circle at the bottom (50px - 45px radius = 5px)
          zIndex: 50
        }}
      >
        <path d="M75 0H80V5H85V10H90V15H85V20H80V25H85V35H90V65H85V75H80V80H75V85H70V90H60V95H30V90H20V85H15V80H10V75H5V65H0V35H5V25H10V20H15V15H20V10H30V5H60V10H70V5H75V0Z" fill="#343235"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M20 40H30V45V50V55V60H20V55V50V45V40ZM55 40H65V45V50V55V60H55V55V50V45V40Z" fill="white"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M30 40H40V45V50V55V60H30V55V50V45V40ZM65 40H75V45V50V55V60H65V55V50V45V40Z" fill="black"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M45 35H15V40V45H0L0 50L0 55L0 60H5V55V50H15V55V60V65H45V60V55V50H50V55V60V65H80V60V55V50V45V40V35H50V40V45H45V40V35ZM75 60V55V50V45V40H55V45V50V55V60H75ZM40 60H20V55V50V45V40H40V45V50V55V60Z" fill="#C5030E"/>
        <path d="M40 10H45V15H40V10Z" fill="#ABAAA8"/>
        <path d="M25 15H35V25H25V15Z" fill="#ABAAA8"/>
        <path d="M65 75H40V80H65V75Z" fill="#ABAAA8"/>
        <rect x="100" y="35" width="5" height="5" fill="#FF1A0B"/>
        <rect x="100" y="30" width="5" height="5" fill="#FFD067"/>
        <path d="M95 5H85V10H95V15H100V30H105V15H100V10H95V5Z" fill="#CD916D"/>
      </svg>
    </div>
  );
};

export default RollingBomb; 