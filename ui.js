// UI Module - Handles all user interface interactions and rendering
const UIManager = (() => {
  const initNavigation = () => {
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
    const navLinks = document.querySelectorAll('.nav-link');
    const navBrand = document.querySelector('.navbar-brand');

    if (toggle && links) {
      toggle.addEventListener('click', () => {
        links.classList.toggle('open');
        toggle.classList.toggle('active');
      });

      links.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          links.classList.remove('open');
          toggle.classList.remove('active');
        });
      });
    }

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        switchPage(link.dataset.page);
      });
    });

    navBrand?.addEventListener('click', () => switchPage('home'));
  };

  const switchPage = (pageName) => {
    document.querySelectorAll('.page').forEach(p => {
      if (p.classList.contains('active')) {
        p.style.opacity = '0';
        p.style.transition = 'opacity 0.3s ease-in-out';
        setTimeout(() => {
          p.classList.remove('active');
          p.style.opacity = '';
          p.style.transition = '';
        }, 300);
      }
    });

    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    setTimeout(() => {
      const pageEl = document.getElementById(`page-${pageName}`);
      if (pageEl) {
        pageEl.classList.add('active');
        pageEl.style.opacity = '0';
        pageEl.style.transition = 'opacity 0.4s ease-out';
        void pageEl.offsetWidth;
        pageEl.style.opacity = '1';
        setTimeout(() => {
          pageEl.style.opacity = '';
          pageEl.style.transition = '';
        }, 400);
      }

      const navLink = document.querySelector(`[data-page="${pageName}"]`);
      if (navLink?.classList.contains('nav-link')) {
        navLink.classList.add('active');
      }
    }, 300);
  };

  const renderHistory = () => {
    const historyList = document.getElementById('historyList');
    const links = StorageManager.getLinks();

    if (!historyList) return;

    if (links.length === 0) {
      historyList.innerHTML = '<div class="empty-state" role="status"><div class="empty-icon">🔗</div><p>No links shortened yet</p></div>';
      return;
    }

    historyList.innerHTML = links.map(link => {
      const isExpired = link.expiresAt && link.expiresAt < Date.now();
      const displayUrl = `linkforge.local/${link.code}`;
      return `
        <div class="history-item" data-code="${link.code}" role="listitem">
          <span class="short-link">${displayUrl}</span>
          <span class="original-link" title="${link.originalUrl}">${link.originalUrl}</span>
          ${link.clicks ? `<span class="click-count" aria-label="Clicks: ${link.clicks}" title="This link was accessed ${link.clicks} time(s)">👁️ ${link.clicks}</span>` : ''}
          <div class="history-actions">
            <button class="btn-icon copy-history-btn" data-code="${link.code}" title="Copy short link" aria-label="Copy ${displayUrl}">📋</button>
            <button class="btn-icon delete-history-btn" data-code="${link.code}" title="Delete link" aria-label="Delete ${displayUrl}">🗑️</button>
          </div>
        </div>
      `;
    }).join('');

    historyList.querySelectorAll('.copy-history-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.dataset.code;
        Utils.copyToClipboard(`#code=${code}`);
      });
    });

    historyList.querySelectorAll('.delete-history-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.dataset.code;
        StorageManager.deleteLink(code);
        renderHistory();
        Utils.showToast('🗑️ Link deleted');
      });
    });
  };

  const displayShortenResult = (code, originalUrl) => {
    const resultBox = document.getElementById('resultBox');
    const resultLink = document.getElementById('resultLink');
    if (resultBox && resultLink) {
      resultLink.textContent = `linkforge.local/${code}`;
      resultLink.href = '#code=' + code;
      resultBox.classList.add('visible');
    }
  };

  const initShortenPage = () => {
    const shortenBtn = document.getElementById('shortenBtn');
    const urlInput = document.getElementById('urlInput');
    const copyBtn = document.getElementById('copyBtn');

    shortenBtn?.addEventListener('click', () => {
      const url = urlInput.value.trim();
      if (!url) {
        Utils.showToast('❌ Please enter a URL');
        urlInput?.focus();
        return;
      }

      let finalUrl = url.startsWith('http') ? url : 'https://' + url;
      if (!Utils.isValidUrl(finalUrl)) {
        Utils.showToast('❌ Invalid URL');
        return;
      }

      const code = Utils.generateShortCode();
      StorageManager.storeLink(code, finalUrl);
      displayShortenResult(code, finalUrl);
      renderHistory();
      urlInput.value = '';
      Utils.showToast('✓ Link shortened!');
    });

    urlInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') shortenBtn?.click();
    });

    copyBtn?.addEventListener('click', () => {
      const link = document.getElementById('resultLink');
      if (link) Utils.copyToClipboard(link.href);
    });

    renderHistory();
  };

  const initQRPage = () => {
    const generateBtn = document.getElementById('generateBtn');
    const qrInput = document.getElementById('qrInput');
    const qrOutput = document.getElementById('qrOutput');
    const qrCanvas = document.getElementById('qrCanvas');
    const downloadBtn = document.getElementById('downloadBtn');
    let qrInstance = null;

    generateBtn?.addEventListener('click', () => {
      const text = qrInput.value.trim();
      if (!text) {
        Utils.showToast('❌ Enter text or URL');
        qrInput?.focus();
        return;
      }

      try {
        qrCanvas.innerHTML = '';
        qrInstance = new QRCode(qrCanvas, {
          text,
          width: 300,
          height: 300,
          correctLevel: QRCode.CorrectLevel.H,
          colorDark: '#000000',
          colorLight: '#ffffff'
        });
        qrOutput.classList.add('visible');
        Utils.showToast('✓ QR code generated!');
      } catch (e) {
        Utils.showToast('❌ Error generating QR code');
      }
    });

    qrInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') generateBtn?.click();
    });

    downloadBtn?.addEventListener('click', () => {
      // qrcodejs internally renders into a canvas/svg/image inside `qrCanvas`.
      const internalCanvas = qrInstance?._oDrawing?._elCanvas || qrCanvas?.querySelector('canvas');
      if (!internalCanvas?.toDataURL) {
        Utils.showToast('❌ Generate QR first');
        return;
      }
      const link = document.createElement('a');
      link.href = internalCanvas.toDataURL('image/png');
      link.download = 'qrcode.png';
      link.click();
      Utils.showToast('⬇️ Download started!');
    });
  };

  const initContactPage = () => {
    const contactForm = document.getElementById('contactForm');
    const formFeedback = document.getElementById('formFeedback');

    contactForm?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('contactName')?.value.trim();
      const email = document.getElementById('contactEmail')?.value.trim();
      const subject = document.getElementById('contactSubject')?.value;
      const message = document.getElementById('contactMessage')?.value.trim();

      if (!name || !email || !subject || !message) {
        showFormFeedback('❌ All fields required', 'error');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showFormFeedback('❌ Invalid email', 'error');
        return;
      }

      showFormFeedback('📤 Sending...', 'loading');

      try {
        const response = await fetch('https://formspree.io/f/mvoezlwb', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ name, email, subject, message, _replyto: email })
        });

        if (response.ok) {
          showFormFeedback('✅ Message sent!', 'success');
          contactForm.reset();
          setTimeout(() => showFormFeedback('', ''), 5000);
        } else {
          showFormFeedback('⚠️ Unable to send. Try later.', 'error');
        }
      } catch (error) {
        showFormFeedback('⚠️ Error sending message', 'error');
      }
    });

    const showFormFeedback = (message, type) => {
      if (formFeedback) {
        formFeedback.textContent = message;
        formFeedback.className = `form-feedback ${type}`;
      }
    };
  };

  return { initNavigation, switchPage, renderHistory, displayShortenResult, initShortenPage, initQRPage, initContactPage };
})();
