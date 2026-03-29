// Animations Module - Handles animations with performance optimization for mobile
const AnimationEngine = (() => {
  const isMobileDevice = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const shouldReduceAnimations = () => isMobileDevice() || isReducedMotion;

  const initGalaxyAnimation = () => {
    if (shouldReduceAnimations()) {
      console.log('⚡ Animations reduced for performance');
      return;
    }

    const stars = Array.from({ length: 20 }, () => ({
      opacity: Math.random() * 0.5 + 0.3,
      targetOpacity: Math.random() * 0.6 + 0.3,
      velocity: Math.random() * 0.02 - 0.01,
    }));

    let animationFrameId = null;

    const updateStarTwinkling = () => {
      stars.forEach(star => {
        star.opacity += (star.targetOpacity - star.opacity) * 0.05;
        if (Math.random() > 0.98) {
          star.targetOpacity = Math.random() * 0.7 + 0.2;
        }
      });
    };

    const animate = () => {
      updateStarTwinkling();
      const elapsed = Date.now() / 1000;
      const galaxyRotation = (elapsed * 6) % 360;

      document.documentElement.style.setProperty('--galaxy-rotation', `${galaxyRotation}deg`);
      for (let i = 0; i < Math.min(5, stars.length); i++) {
        document.documentElement.style.setProperty(`--star-opacity-${i}`, stars[i].opacity.toFixed(2));
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return {
      stop: () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      }
    };
  };

  const initThemeRotation = () => {
    const THEMES = [
      { name: '🌌 Nebula', class: 'theme-nebula' },
      { name: '🚗 Tesla', class: 'theme-tesla' },
      { name: '🏎️ Ferrari', class: 'theme-ferrari' },
      { name: '🏁 Porsche', class: 'theme-porsche' },
      { name: '🚙 BMW', class: 'theme-bmw' },
      { name: '💨 Bugatti', class: 'theme-bugatti' },
      { name: '☿️ Mercury', class: 'theme-mercury' },
      { name: '🌊 Neptune', class: 'theme-neptune' },
      { name: '❄️ Uranus', class: 'theme-uranus' },
      { name: '🔵 Pluto', class: 'theme-pluto' },
      { name: '🌲 Forest', class: 'theme-forest' },
      { name: '🌿 Jungle', class: 'theme-jungle' },
      { name: '🍂 Autumn', class: 'theme-autumn' },
      { name: '🌸 Spring', class: 'theme-spring' },
      { name: '🏝️ Tropical', class: 'theme-tropical' },
      { name: '🏖️ Mediterranean', class: 'theme-mediterranean' },
      { name: '🌅 Sunset Beach', class: 'theme-sunset-beach' },
      { name: '🏔️ Mountain', class: 'theme-mountain' },
      { name: '🧊 Arctic', class: 'theme-arctic' },
      { name: '🪨 Canyon', class: 'theme-canyon' },
      { name: '🌋 Lava', class: 'theme-lava' },
      { name: '⛈️ Storm', class: 'theme-storm' },
      { name: '🌞 Sunrise', class: 'theme-sunrise' },
      { name: '⬜ Minimalist', class: 'theme-minimalist' },
      { name: '🚀 Futuristic', class: 'theme-futuristic' }
    ];

    let currentThemeIndex = 0;
    const rotateInterval = shouldReduceAnimations() ? 300000 : 120000; // 5 or 2 minutes

    const rotate = () => {
      THEMES.forEach(t => document.body.classList.remove(t.class));
      currentThemeIndex = (currentThemeIndex + 1) % THEMES.length;
      document.body.classList.add(THEMES[currentThemeIndex].class);

      const label = document.getElementById('themeLabel');
      if (label) {
        label.textContent = `Theme: ${THEMES[currentThemeIndex].name}`;
      }
    };

    // Set initial theme
    document.body.classList.add(THEMES[currentThemeIndex].class);
    const label = document.getElementById('themeLabel');
    if (label) label.textContent = `Theme: ${THEMES[currentThemeIndex].name}`;

    // Rotate theme
    setInterval(rotate, rotateInterval);
  };

  const optimizePageTransitions = () => {
    if (shouldReduceAnimations()) {
      // Reduce transition duration on mobile
      document.documentElement.style.setProperty('--transition-smooth', '0.2s cubic-bezier(.4,0,.2,1)');
      document.documentElement.style.setProperty('--transition-fast', '0.1s cubic-bezier(.4,0,.2,1)');
    }
  };

  return {
    initGalaxy: initGalaxyAnimation,
    initThemes: initThemeRotation,
    optimizeTransitions: optimizePageTransitions,
    isMobile: isMobileDevice,
    hasReducedMotion: () => isReducedMotion
  };
})();
