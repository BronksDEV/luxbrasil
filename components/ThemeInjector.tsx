
import React, { useEffect } from 'react';
import { useThemeConfig } from '../contexts/ThemeContext';

const ThemeInjector: React.FC = () => {
  const { themeConfig } = useThemeConfig();

  useEffect(() => {
    const applyTheme = () => {
        const existingStyle = document.getElementById('lux-custom-theme');
        if(existingStyle) existingStyle.remove();

        if (themeConfig.active) {
            if (themeConfig.name === 'carnival') {
                const style = document.createElement('style');
                style.id = 'lux-custom-theme';
                
                // SVG das Máscaras Duplas - Solicitado pelo usuário
                // Utilizando cor #f114f5 (Rosa) conforme SVG original, mas com opacidade controlada no CSS
                const svgString = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 473.194 473.194' width='200' height='200' fill='%23f114f5'><g><path d='M464.653,167.757c-0.824-3.273-2.996-6.037-5.969-7.633c-2.965-1.586-6.47-1.855-9.65-0.738 c-27.88,9.795-70.896,16.098-119.276,16.098c-11.762,0-23.098-0.449-34.089-1.156c-5.683,25.676-14.764,49.252-26.363,70.016 c0.564-0.023,1.103-0.115,1.672-0.115c15.034,0,27.218-1.254,27.218,8.873c0,10.127-12.185,27.803-27.218,27.803 c-8.757,0-16.467-2.834-21.442-7.162c-15.025,18.654-32.578,33.363-51.909,43.09c21.795,73.361,72.751,124.824,132.131,124.824 c79.219,0,143.437-91.584,143.437-204.559C473.194,212.728,470.151,189.408,464.653,167.757z M386.92,381.927 c-0.254,1.078-1.056,1.957-2.11,2.303c-1.056,0.353-2.218,0.131-3.066-0.586c-11.174-9.389-30.182-15.627-51.985-15.627 c-21.805,0-40.813,6.238-51.986,15.627c-0.849,0.709-2.012,0.932-3.066,0.586c-1.055-0.354-1.856-1.225-2.11-2.303 c-0.925-3.936-1.494-7.994-1.494-12.215c0-32.395,26.263-58.656,58.657-58.656c32.394,0,58.655,26.262,58.655,58.656 C388.413,373.933,387.844,377.992,386.92,381.927z M388.537,280.904c-15.034,0-27.218-17.676-27.218-27.803 c0-10.127,12.185-8.873,27.218-8.873c15.033,0,27.218,8.211,27.218,18.338C415.754,272.693,403.57,280.904,388.537,280.904z'/><path d='M286.874,109.925c0-24.367-3.043-47.688-8.541-69.338c-0.824-3.273-2.996-6.039-5.969-7.633 c-1.756-0.939-3.705-1.416-5.669-1.416c-1.341,0-2.688,0.221-3.981,0.678c-27.88,9.795-70.895,16.096-119.276,16.096 c-48.382,0-91.397-6.301-119.277-16.096c-1.286-0.457-2.626-0.678-3.966-0.678c-1.963,0-3.921,0.482-5.685,1.424 c-2.965,1.594-5.144,4.359-5.969,7.625C3.043,62.238,0,85.558,0,109.925c0,112.977,64.217,204.559,143.438,204.559 C222.657,314.484,286.874,222.902,286.874,109.925z M57.439,135.349c0-10.129,12.185-18.338,27.219-18.338 c15.033,0,27.218,17.674,27.218,27.803c0,10.127-12.185,8.873-27.218,8.873C69.624,153.687,57.439,145.476,57.439,135.349z M143.438,275.812c-32.395,0-58.656-26.262-58.656-58.654c0-4.221,0.569-8.281,1.493-12.217c0.254-1.076,1.056-1.947,2.11-2.303 c1.056-0.346,2.218-0.123,3.066,0.586c11.174,9.389,30.182,15.627,51.986,15.627c21.804,0,40.812-6.238,51.985-15.627 c0.849-0.717,2.011-0.939,3.066-0.586c1.055,0.348,1.856,1.227,2.11,2.303c0.924,3.936,1.494,7.996,1.494,12.217 C202.093,249.55,175.831,275.812,143.438,275.812z M174.998,144.814c0-10.129,12.185-27.803,27.219-27.803 c15.033,0,27.218,8.209,27.218,18.338c0,10.127-12.185,18.338-27.218,18.338C187.183,153.687,174.998,154.941,174.998,144.814z'/></g></svg>`;
                const maskSVG = `url("data:image/svg+xml,${encodeURIComponent(svgString)}")`;

                style.innerHTML = `
                    :root {
                        --primary-gold: #9C27B0 !important; /* Roxo Carnaval */
                        --secondary-gold: #00E676 !important; /* Verde Neon */
                        --accent-gold: #FFD700 !important; /* Dourado Clássico */
                    }
                    
                    /* Background Global Animado */
                    body {
                        background-color: #050510;
                        overflow-x: hidden;
                    }
                    
                    /* LAYER 1: Máscaras Flutuantes Realistas (Lento, Fundo) */
                    body::after {
                        content: "";
                        position: fixed;
                        top: 0; left: 0; width: 100%; height: 100%;
                        background-image: ${maskSVG};
                        background-repeat: repeat;
                        background-size: 350px 350px;
                        background-position: 0 0;
                        opacity: 0.08;
                        z-index: -2;
                        pointer-events: none;
                        animation: float-masks 60s linear infinite;
                    }

                    /* Buttons Gradient Override - Mais Vibrante */
                    .MuiButton-containedPrimary {
                        background: linear-gradient(135deg, #7B1FA2 0%, #E040FB 50%, #00E676 100%) !important;
                        box-shadow: 0 0 20px rgba(156, 39, 176, 0.6) !important;
                        border: 1px solid rgba(255,255,255,0.3) !important;
                        position: relative;
                        overflow: hidden;
                    }
                    
                    /* Efeito de brilho passando no botão */
                    .MuiButton-containedPrimary::after {
                        content: '';
                        position: absolute;
                        top: 0; left: -100%;
                        width: 100%; height: 100%;
                        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
                        animation: shimmer-btn 3s infinite;
                    }

                    /* Typography Highlights - Gradiente Carnaval */
                    h1, h2, h3, h4, .MuiTypography-h1, .MuiTypography-h2, .MuiTypography-h3, .MuiTypography-h4 {
                        background: linear-gradient(90deg, #E040FB, #FFD700, #00E676);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        filter: drop-shadow(0 0 5px rgba(156, 39, 176, 0.5));
                    }

                    /* Keyframes Globais */
                    @keyframes float-masks {
                        0% { background-position: 0 0; }
                        100% { background-position: 350px 350px; }
                    }

                    @keyframes shimmer-btn {
                        0% { left: -100%; }
                        20% { left: 100%; }
                        100% { left: 100%; }
                    }

                    @keyframes sway {
                        0%, 100% { transform: rotate(-5deg); }
                        50% { transform: rotate(5deg); }
                    }

                    @keyframes neon-pulse {
                        0% { box-shadow: 0 0 10px #E040FB, inset 0 0 5px #E040FB; }
                        50% { box-shadow: 0 0 25px #00E676, inset 0 0 10px #00E676; }
                        100% { box-shadow: 0 0 10px #E040FB, inset 0 0 5px #E040FB; }
                    }
                    
                    @keyframes float-slow {
                        0% { transform: translate(0, 0) rotate(0deg); }
                        50% { transform: translate(10px, -15px) rotate(2deg); }
                        100% { transform: translate(0, 0) rotate(0deg); }
                    }

                    /* --- MOBILE ADJUSTMENTS --- */
                    @media (max-width: 768px) {
                        body::after {
                            background-size: 150px 150px !important;
                            opacity: 0.06 !important; 
                            animation: float-masks 40s linear infinite !important;
                        }
                    }
                `;
                document.head.appendChild(style);
            } else if (themeConfig.name === 'custom' && themeConfig.custom_css) {
                const style = document.createElement('style');
                style.id = 'lux-custom-theme';
                style.innerHTML = themeConfig.custom_css;
                document.head.appendChild(style);
            }
        }
    };
    
    applyTheme();
  }, [themeConfig]);

  return null;
};

export default ThemeInjector;
