/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./App.tsx",
        "./index.tsx",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./utils/**/*.{js,ts,jsx,tsx}",
        "./constants.ts",
        "./types.ts"
    ],
    theme: {
        extend: {
            screens: {
                'landscape': { 'raw': '(orientation: landscape) and (max-height: 500px)' },
            },
        },
    },
    plugins: [],
}
