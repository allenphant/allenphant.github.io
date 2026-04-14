// Override Astro's SvgComponent type for this Vite-only prototype.
// At runtime Vite resolves *.svg imports as URL strings; Astro's type
// definition incorrectly shadows this in the root tsconfig.
declare module '*.svg' {
  const src: string
  export default src
}

declare module '*.png' {
  const src: string
  export default src
}
