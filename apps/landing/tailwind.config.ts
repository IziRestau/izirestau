import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			},
  			'fade-in': {
  				from: { opacity: '0', transform: 'translateY(20px)' },
  				to: { opacity: '1', transform: 'translateY(0)' }
  			},
  			'slide-in-left': {
  				from: { opacity: '0', transform: 'translateX(-40px)' },
  				to: { opacity: '1', transform: 'translateX(0)' }
  			},
  			'slide-in-right': {
  				from: { opacity: '0', transform: 'translateX(40px)' },
  				to: { opacity: '1', transform: 'translateX(0)' }
  			},
  			'scroll-logos': {
  				from: { transform: 'translateX(0)' },
  				to: { transform: 'translateX(-50%)' }
  			},
  			'count-up': {
  				from: { opacity: '0', transform: 'scale(0.5)' },
  				to: { opacity: '1', transform: 'scale(1)' }
  			},
  			'float-1': {
  				'0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
  				'33%': { transform: 'translateY(-10px) rotate(1deg)' },
  				'66%': { transform: 'translateY(5px) rotate(-0.5deg)' },
  			},
  			'float-2': {
  				'0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
  				'50%': { transform: 'translateY(-14px) rotate(-1.5deg)' },
  			},
  			'float-3': {
  				'0%, 100%': { transform: 'translateY(0) translateX(0)' },
  				'40%': { transform: 'translateY(-8px) translateX(5px)' },
  				'80%': { transform: 'translateY(4px) translateX(-3px)' },
  			},
  			'scroll-line': {
  				'0%': { top: '-100%' },
  				'50%': { top: '100%' },
  				'100%': { top: '100%' },
  			},
  			'timeline-pulse': {
  				'0%': { transform: 'scale(1)', opacity: '0.6' },
  				'100%': { transform: 'scale(2.5)', opacity: '0' },
  			},
  			'price-in': {
  				'0%': { opacity: '0', transform: 'translateY(8px) scale(0.95)' },
  				'100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
  			},
  			'marquee-left': {
  				'0%': { transform: 'translateX(0)' },
  				'100%': { transform: 'translateX(-50%)' },
  			},
  			'marquee-right': {
  				'0%': { transform: 'translateX(-50%)' },
  				'100%': { transform: 'translateX(0)' },
  			},
  			'progress-fill': {
  				'0%': { width: '0%' },
  				'100%': { width: '100%' },
  			},
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'fade-in': 'fade-in 0.6s ease-out forwards',
  			'slide-in-left': 'slide-in-left 0.6s ease-out forwards',
  			'slide-in-right': 'slide-in-right 0.6s ease-out forwards',
  			'scroll-logos': 'scroll-logos 30s linear infinite',
  			'count-up': 'count-up 0.5s ease-out forwards',
  			'float-1': 'float-1 7s ease-in-out infinite',
  			'float-2': 'float-2 8s ease-in-out infinite',
  			'float-3': 'float-3 9s ease-in-out infinite',
  			'scroll-line': 'scroll-line 1.8s ease-in-out infinite',
  			'timeline-pulse': 'timeline-pulse 2s ease-out infinite',
  			'price-in': 'price-in 0.35s ease-out',
  			'marquee-left': 'marquee-left var(--marquee-duration, 40s) linear infinite',
  			'marquee-right': 'marquee-right var(--marquee-duration, 40s) linear infinite',
  		}
  	}
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
