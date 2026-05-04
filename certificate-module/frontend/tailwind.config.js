/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
        extend: {
            colors: {
                skin: { DEFAULT: '#169f48', dark: '#0f7f3a' },
                primary: '#1fb6a6',
                dark: '#0a0717',
                muted: '#6e798a',
                border: '#e0e5f3',
                bodybg: '#f8f9ff',
                lightgreen: '#f4fef7',
                danger: '#ef3f6e',
                warning: '#f5a623',
            },
            fontFamily: {
                sans: ['Inter', 'Roboto', 'system-ui', 'Arial', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
