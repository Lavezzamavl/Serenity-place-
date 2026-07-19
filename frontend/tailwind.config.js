/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        harbor: '#10315B',   // deep navy - sidebar, headers, authority
        serenity: '#3E7CB1', // primary blue - buttons, links, active states
        sage: '#7FA895',     // signature accent - progress, recovery, positive states ONLY
        mist: '#EAF1F6',     // light backgrounds
        slate: '#5B6B79',    // secondary text
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],   // module titles, big dashboard numbers
        sans: ['Inter', 'sans-serif'],    // all UI text, tables, labels
        mono: ['IBM Plex Mono', 'monospace'], // patient IDs, admission numbers
      },
    },
  },
  plugins: [],
}