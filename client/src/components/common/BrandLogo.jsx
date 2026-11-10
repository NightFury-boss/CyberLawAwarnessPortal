import React from 'react';
import { Link } from 'react-router-dom';

/**
 * BrandLogo — Canonical Reusable Brand Component for Cyber Law Awareness Portal
 * 
 * Supports the authentic brand identity variations from the authoritative Cyber Law Brand Board:
 * - primary: Primary stacked monument + wordmark + tagline (3D monument, Playfair + Montserrat)
 * - horizontal: Light horizontal logo for light headers and surfaces
 * - horizontal-dark: Dark horizontal logo for dark headers, footers, and sidebars
 * - icon-light: Light squircle app icon (Warm Ivory #F8F1E6)
 * - icon-dark: Dark squircle app icon (Charcoal Brown #3A2E26)
 * - monogram: Isolated 3D monument monogram
 */

const LOGO_VARIANTS = {
  primary: {
    src: '/brand/cyberlaw-logo-primary.svg',
    pngFallback: '/brand/cyberlaw-logo-primary.png',
    alt: 'Cyber Law Awareness Portal — Learn, Recognize, Stay Safe',
    aspectRatio: '528 / 362'
  },
  'primary-transparent': {
    src: '/brand/cyberlaw-logo-primary-transparent.svg',
    pngFallback: '/brand/cyberlaw-logo-primary-transparent.png',
    alt: 'Cyber Law Awareness Portal',
    aspectRatio: '528 / 362'
  },
  horizontal: {
    src: '/brand/cyberlaw-logo-horizontal.svg',
    pngFallback: '/brand/cyberlaw-logo-horizontal.png',
    alt: 'Cyber Law Awareness Portal',
    aspectRatio: '316 / 108'
  },
  'horizontal-dark': {
    src: '/brand/cyberlaw-logo-horizontal-dark.svg',
    pngFallback: '/brand/cyberlaw-logo-horizontal-dark.png',
    alt: 'Cyber Law Awareness Portal',
    aspectRatio: '392 / 108'
  },
  'icon-light': {
    src: '/brand/cyberlaw-icon-light.svg',
    pngFallback: '/brand/cyberlaw-icon-light.png',
    alt: 'Cyber Law App Icon',
    aspectRatio: '1 / 1'
  },
  'icon-dark': {
    src: '/brand/cyberlaw-icon-dark.svg',
    pngFallback: '/brand/cyberlaw-icon-dark.png',
    alt: 'Cyber Law App Icon',
    aspectRatio: '1 / 1'
  },
  monogram: {
    src: '/brand/cyberlaw-monogram.svg',
    pngFallback: '/brand/cyberlaw-monogram.png',
    alt: 'Cyber Law Monument Monogram',
    aspectRatio: '254 / 208'
  }
};

export default function BrandLogo({
  variant = 'horizontal',
  height = 36,
  width = 'auto',
  className = '',
  style = {},
  alt,
  to,
  ariaLabel,
  loading = 'eager'
}) {
  const config = LOGO_VARIANTS[variant] || LOGO_VARIANTS.horizontal;
  const resolvedAlt = alt !== undefined ? alt : config.alt;

  const imageElement = (
    <img
      src={config.src}
      alt={resolvedAlt}
      className={`brand-logo-img ${className}`}
      loading={loading}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        width: typeof width === 'number' ? `${width}px` : width,
        aspectRatio: config.aspectRatio,
        display: 'inline-block',
        verticalAlign: 'middle',
        objectFit: 'contain',
        ...style
      }}
    />
  );

  if (to) {
    return (
      <Link
        to={to}
        className={`brand-logo-link ${className ? `${className}-link` : ''}`}
        aria-label={ariaLabel || resolvedAlt}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          textDecoration: 'none'
        }}
      >
        {imageElement}
      </Link>
    );
  }

  return imageElement;
}

