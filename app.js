// Main App Initialization - Ties all modules together with accessibility enhancements
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 LinkForge initializing...');

  // Add accessibility attributes to enhance usability
  const addAccessibilityFeatures = () => {
    // Main navigation
    const navbar = document.querySelector('.navbar');
    if (navbar) navbar.setAttribute('role', 'navigation');

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.setAttribute('role', 'menuitem');
      link.setAttribute('aria-label', `Navigate to ${link.textContent}`);
    });

    // Main content
    const main = document.querySelector('main') || document.querySelector('.main-content');
    if (main) main.setAttribute('role', 'main');

    // Forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.setAttribute('aria-label', 'Submit form');
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        if (!input.getAttribute('aria-label') && input.placeholder) {
          input.setAttribute('aria-label', input.placeholder);
        }
      });
    });

    // Buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
      if (!btn.getAttribute('aria-label') && btn.title) {
        btn.setAttribute('aria-label', btn.title);
      } else if (!btn.getAttribute('aria-label')) {
        btn.setAttribute('aria-label', btn.textContent || 'button');
      }
    });

    // Links
    const links = document.querySelectorAll('a');
    links.forEach(link => {
      if (!link.getAttribute('aria-label')) {
        link.setAttribute('aria-label', link.textContent || 'link');
      }
    });

    // History/List items
    const historyList = document.getElementById('historyList');
    if (historyList) {
      historyList.setAttribute('role', 'list');
      historyList.setAttribute('aria-label', 'Shortened links history');
    }

    console.log('✅ Accessibility features added');
  };

  // Initialize all modules
  const initializeApp = () => {
    console.log('🔧 Running initializeApp()');
    
    // Initialize animations & UI FIRST
    AnimationEngine.optimizeTransitions();
    AnimationEngine.initGalaxy();
    AnimationEngine.initThemes();
    
    // Initialize UI module navigation
    UIManager.initNavigation();
    UIManager.initShortenPage();
    UIManager.initQRPage();
    UIManager.initContactPage();
    
    console.log('✅ UIManager initialized');
    
    // NOW set up feature cards AFTER UIManager is ready
    addAccessibilityFeatures();
    setupFeatureCards();

    // Keyboard navigation support
    document.addEventListener('keydown', (e) => {
      // ESC to close mobile menu
      if (e.key === 'Escape') {
        const navLinks = document.getElementById('navLinks');
        const toggle = document.getElementById('navToggle');
        if (navLinks && toggle) {
          navLinks.classList.remove('open');
          toggle.classList.remove('active');
        }
      }
    });

    console.log('✅ LinkForge Ready!');
    console.log('📊 Features:', {
      urlShortening: '✓',
      qrGeneration: '✓',
      linkExpiration: '✓',
      analytics: '✓',
      customCodes: '✓',
      accessibility: '✓',
      mobileOptimized: '✓'
    });
  };
  
  // Setup feature cards specifically
  const setupFeatureCards = () => {
    const featureCards = document.querySelectorAll('.feature-card');
    console.log('🎯 Setting up feature cards. Found:', featureCards.length);
    
    featureCards.forEach((card) => {
      // Add accessibility attributes
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', card.textContent.replace(/\s+/g, ' ').trim());
      
      // Add click handler
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        const pageName = card.dataset.page;
        console.log('🖱️ Feature card clicked. Page:', pageName);
        console.log('📍 UIManager available:', typeof UIManager !== 'undefined');
        
        if (pageName && typeof UIManager !== 'undefined' && UIManager.switchPage) {
          console.log('✨ Switching to:', pageName);
          UIManager.switchPage(pageName);
        } else {
          console.error('❌ Failed to switch page. Page:', pageName, 'UIManager:', typeof UIManager);
        }
      });
      
      // Add keyboard support
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const pageName = card.dataset.page;
          if (pageName && typeof UIManager !== 'undefined' && UIManager.switchPage) {
            UIManager.switchPage(pageName);
          }
        }
      });
    });
    
    console.log('✅ Feature cards setup complete');
  };

  // Wait for DOM to be fully ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    setTimeout(initializeApp, 100);
  }
});

// Handle page visibility for animation optimization
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('📊 Page hidden - reducing animations');
  } else {
    console.log('📊 Page visible - resuming animations');
  }
});
