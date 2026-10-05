const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
    theme: {
        extend: {
            animation: {
                'spin-slow': 'spin 10s linear infinite',
            }
        },
    },
};

export default config;
