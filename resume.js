// Resume Module - Industry-Grade Resume Builder with Advanced Features
const ResumeManager = (() => {
  const STORAGE_KEY = 'linkforge_resume_draft';
  const RENDER_DEBOUNCE_MS = 800;

  let lastSaveTime = null;
  let isRestoringDraft = false;
  let latexRenderTimeout = null;
  let formValidationErrors = [];

  const formatTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Scroll to top function
  window.scrollToTop = () => {
    const tabsContainer = document.getElementById('resumeTabsContainer');
    if (tabsContainer) {
      tabsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Smooth scroll to section
  window.smoothScrollToSection = (tabName) => {
    const tabContent = document.querySelector(`[data-tab-content="${tabName}"]`);
    if (tabContent) {
      setTimeout(() => {
        tabContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const updateSaveStatus = (date = null) => {
    const el = document.getElementById('saveStatus');
    if (!el) return;
    if (!date) {
      el.textContent = '💾 Never saved';
      lastSaveTime = null;
      return;
    }
    lastSaveTime = date;
    el.textContent = `💾 Last saved: ${formatTime(date)}`;
  };

  // Update word count and reading time estimates
  const updateWordCount = () => {
    try {
      // Collect all text from form fields
      const fieldIds = [
        'resumeName', 'resumeEmail', 'resumePhone', 'resumeLocation', 'resumeSummary',
        'resumeSkills'
      ];

      let allText = '';
      fieldIds.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.value) {
          allText += el.value + ' ';
        }
      });

      // Count words in experience, education, projects, achievements, certifications
      const sections = [
        '.experience-item', '.education-item', '.project-item', 
        '.achievement-item', '.certification-item', '.language-item'
      ];
      sections.forEach(selector => {
        document.querySelectorAll(selector).forEach(item => {
          allText += item.textContent + ' ';
        });
      });

      // Calculate word count
      const words = allText.trim().split(/\s+/).filter(w => w.length > 0);
      const wordCount = words.length;

      // Calculate reading time (average 200 words per minute)
      const readingTimeMinutes = Math.ceil(wordCount / 200);

      // Update display elements
      const wordCountEl = document.getElementById('wordCount');
      if (wordCountEl) {
        wordCountEl.textContent = `📊 Words: ${wordCount}`;
      }

      const readingTimeEl = document.getElementById('estimatedReadTime');
      if (readingTimeEl) {
        readingTimeEl.textContent = `⏱️ ~${readingTimeMinutes} min read`;
      }
    } catch (error) {
      console.warn('Error updating word count:', error);
    }
  };

  const updateProgressBar = () => {
    const progressFill = document.getElementById('progressFill');
    if (!progressFill) return;

    const tabs = ['personal', 'experience', 'education', 'skills', 'projects', 'achievements', 'certifications', 'languages'];
    let completedTabs = 0;

    tabs.forEach(tab => {
      const content = document.querySelector(`[data-tab-content="${tab}"]`);
      if (content && isTabComplete(tab)) {
        completedTabs++;
      }
    });

    const percentage = (completedTabs / tabs.length) * 100;
    progressFill.style.width = Math.round(percentage) + '%';

    // Update completion percentage display
    const percentageEl = document.getElementById('completionPercentage');
    if (percentageEl) {
      percentageEl.textContent = Math.round(percentage);
    }

    // Update completed sections count
    const sectionsEl = document.getElementById('completedSections');
    if (sectionsEl) {
      sectionsEl.textContent = completedTabs;
    }

    // Update completion badges on tabs
    tabs.forEach(tab => {
      const btn = document.querySelector(`[data-tab="${tab}"]`);
      if (btn) {
        const badge = btn.querySelector('.completion-badge');
        if (badge) {
          if (isTabComplete(tab)) {
            badge.style.display = 'inline-block';
          } else {
            badge.style.display = 'none';
          }
        }
      }
    });

    // Update word count when progress updates
    updateWordCount();
  };

  const isTabComplete = (tabName) => {
    switch (tabName) {
      case 'personal': {
        const name = document.getElementById('resumeName')?.value?.trim() || '';
        const email = document.getElementById('resumeEmail')?.value?.trim() || '';
        return name && email;
      }
      case 'experience':
        return document.querySelectorAll('.experience-item').length > 0;
      case 'education':
        return document.querySelectorAll('.education-item').length > 0;
      case 'skills':
        return document.getElementById('resumeSkills')?.value?.trim().length > 0;
      case 'projects':
        return document.querySelectorAll('.project-item').length > 0;
      case 'achievements':
        return document.querySelectorAll('.achievement-item').length > 0;
      case 'certifications':
        return document.querySelectorAll('.certification-item').length > 0;
      case 'languages':
        return document.querySelectorAll('.language-item').length > 0;
      default:
        return false;
    }
  };

  // Initialize resume builder
  const init = () => {
    console.log('📄 Resume Manager initializing...');
    
    initModeSwitcher();
    initFormHandlers();
    initLatexHandlers();
    initTabScrolling();
    setupPreviewButtons();
    setupFileUpload();
    setupManualSaveButton();
    setupManualLoadButton();
    initRealTimeValidation();
    
    console.log('✅ Resume Manager ready - Industry-grade features enabled');
  };

  // Tab Scroll Navigation
  const initTabScrolling = () => {
    const container = document.getElementById('resumeTabsContainer');
    const scrollLeftBtn = document.getElementById('tabScrollLeft');
    const scrollRightBtn = document.getElementById('tabScrollRight');

    if (!container || !scrollLeftBtn || !scrollRightBtn) return;

    const checkScroll = () => {
      scrollLeftBtn.style.display = container.scrollLeft > 0 ? 'flex' : 'none';
      scrollRightBtn.style.display = 
        container.scrollLeft < container.scrollWidth - container.clientWidth ? 'flex' : 'none';
    };

    scrollLeftBtn.addEventListener('click', () => {
      container.scrollBy({ left: -200, behavior: 'smooth' });
      setTimeout(checkScroll, 100);
    });

    scrollRightBtn.addEventListener('click', () => {
      container.scrollBy({ left: 200, behavior: 'smooth' });
      setTimeout(checkScroll, 100);
    });

    container.addEventListener('scroll', checkScroll);
    setTimeout(checkScroll, 100);
  };

  // Setup manual save button
  const setupManualSaveButton = () => {
    const manualSaveBtn = document.getElementById('manualSaveBtn');
    if (manualSaveBtn) {
      manualSaveBtn.addEventListener('click', () => {
        const success = saveDraft();
        if (success) {
          showNotification('✅ Draft saved successfully!', 2000, 'success');
        }
      });
    }
  };

  // Setup manual load button
  const setupManualLoadButton = () => {
    const manualLoadBtn = document.getElementById('manualLoadBtn');
    if (manualLoadBtn) {
      manualLoadBtn.addEventListener('click', () => {
        loadDraft();
      });
    }
  };

  // Mode Switcher - Toggle between Form and LaTeX with Enhanced UI/UX
  const initModeSwitcher = () => {
    const modeBtns = document.querySelectorAll('.mode-btn');
    const formMode = document.getElementById('form-mode');
    const latexMode = document.getElementById('latex-mode');

    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        
        // Add transition effect
        const activeMode = mode === 'form' ? formMode : latexMode;
        const inactiveMode = mode === 'form' ? latexMode : formMode;
        
        // Update active button with animation
        modeBtns.forEach(b => {
          b.classList.remove('active');
          b.style.opacity = '0.6';
          b.style.transform = 'scale(0.95)';
        });
        btn.classList.add('active');
        btn.style.opacity = '1';
        btn.style.transform = 'scale(1)';

        // Fade out current mode
        if (inactiveMode) {
          inactiveMode.style.opacity = '0';
          inactiveMode.style.pointerEvents = 'none';
          inactiveMode.style.transition = 'opacity 0.3s ease-out';
        }

        // Fade in new mode
        if (activeMode) {
          setTimeout(() => {
            activeMode.style.display = 'block';
            activeMode.style.opacity = '1';
            activeMode.style.transition = 'opacity 0.3s ease-in';
            activeMode.style.pointerEvents = 'auto';
          }, 150);
          inactiveMode.style.display = 'none';
        }

        showNotification(`✨ Switched to ${mode === 'form' ? '📝 Form Builder' : '⚙️ LaTeX Code'} mode`);
      });
    });
  };

  // Real-Time Form Validation
  const initRealTimeValidation = () => {
    const personalInputs = document.querySelectorAll('#resumeName, #resumeEmail, #resumePhone, #resumeLocation, #resumeSummary');
    personalInputs.forEach(input => {
      input?.addEventListener('input', () => {
        validatePersonalInfo();
        updateProgressBar();
      });
      input?.addEventListener('blur', () => validatePersonalInfo());
    });

    const summaryField = document.getElementById('resumeSummary');
    const summaryCount = document.getElementById('summaryCount');
    summaryField?.addEventListener('input', () => {
      if (summaryCount) {
        const length = summaryField.value.length;
        summaryCount.textContent = length;
        if (length > 500) {
          summaryField.value = summaryField.value.substring(0, 500);
          summaryCount.textContent = '500';
          showNotification('⚠️ Summary limited to 500 characters', 2000, 'warning');
        }
        summaryField.style.borderColor = length > 400 ? 'rgba(255, 193, 7, 0.5)' : '';
      }
    });

    const skillsField = document.getElementById('resumeSkills');
    skillsField?.addEventListener('input', () => updateProgressBar());
  };

  const validatePersonalInfo = () => {
    const name = document.getElementById('resumeName')?.value?.trim() || '';
    const email = document.getElementById('resumeEmail')?.value?.trim() || '';
    const errors = [];

    if (!name) errors.push('Full name is required');
    if (!email) errors.push('Email is required');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Email format is invalid');
    }

    formValidationErrors = errors;
    displayValidationErrors();
  };

  const displayValidationErrors = () => {
    const msgEl = document.getElementById('validationMessage');
    if (!msgEl) return;

    if (formValidationErrors.length === 0) {
      msgEl.style.display = 'none';
      return;
    }

    msgEl.style.display = 'block';
    msgEl.style.background = 'rgba(255, 193, 7, 0.1)';
    msgEl.style.borderLeft = '4px solid #ffc107';
    msgEl.style.color = '#ffc107';
    msgEl.innerHTML = formValidationErrors.map(err => `⚠️ ${err}`).join('<br>');
  };

  // Setup File Upload for Loading from System
  const setupFileUpload = () => {
    const fileInput = document.getElementById('fileUploadInput');
    const loadBtn = document.getElementById('manualLoadBtn');
    
    if (!fileInput || !loadBtn) return;

    loadBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result;
          if (typeof content !== 'string') {
            showNotification('❌ Invalid file format', 3000, 'error');
            return;
          }

          let data;
          try {
            // Try to parse as JSON (exported resume)
            data = JSON.parse(content);
          } catch {
            // If not JSON, treat as HTML and try to extract data
            showNotification('⚠️ File format not recognized. Please use exported JSON resume.', 3000, 'warning');
            return;
          }

          // Restore form data from JSON
          if (data.name) document.getElementById('resumeName').value = data.name;
          if (data.email) document.getElementById('resumeEmail').value = data.email;
          if (data.phone) document.getElementById('resumePhone').value = data.phone;
          if (data.location) document.getElementById('resumeLocation').value = data.location;
          if (data.summary) document.getElementById('resumeSummary').value = data.summary;
          if (data.skills) document.getElementById('resumeSkills').value = data.skills;

          // Clear existing items
          ['experienceContainer', 'educationContainer', 'projectsContainer', 'certificationsContainer', 'achievementsContainer', 'languagesContainer'].forEach(id => {
            const container = document.getElementById(id);
            if (container) container.innerHTML = '';
          });

          // Restore items from file
          if (data.experience) data.experience.forEach(() => addFormItem('experience'));
          if (data.education) data.education.forEach(() => addFormItem('education'));
          if (data.projects) data.projects.forEach(() => addFormItem('project'));
          if (data.certifications) data.certifications.forEach(() => addFormItem('certification'));
          if (data.achievements) data.achievements.forEach(() => addFormItem('achievement'));
          if (data.languages) data.languages.forEach(() => addFormItem('language'));

          updateProgressBar();
          showNotification('✅ Resume loaded from file successfully');
          fileInput.value = ''; // Reset file input
        } catch (error) {
          console.error('❌ Error loading file:', error);
          showNotification('❌ Error loading file: ' + error.message, 3000, 'error');
          fileInput.value = '';
        }
      };

      reader.readAsText(file);
    });
  };

  // Setup Preview Buttons
  const setupPreviewButtons = () => {
    const previewBeforeBtn = document.getElementById('previewBeforeSaveBtn');
    const previewAfterBtn = document.getElementById('previewAfterGenerateBtn');

    if (previewBeforeBtn) {
      previewBeforeBtn.addEventListener('click', () => {
        generateResume();
        setTimeout(() => {
          const previewPanel = document.querySelector('.resume-preview-panel');
          if (previewPanel) {
            previewPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      });
    }

    if (previewAfterBtn) {
      previewAfterBtn.addEventListener('click', () => {
        const previewPanel = document.querySelector('.resume-preview-panel');
        if (previewPanel) {
          previewPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  };

  // Form Handlers
  const initFormHandlers = () => {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const activeTab = btn.dataset.tab;
        
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        btn.style.borderColor = 'var(--accent-primary)';
        btn.style.background = 'rgba(124, 58, 237, 0.1)';

        tabBtns.forEach(b => {
          if (b !== btn) {
            b.style.borderColor = 'transparent';
            b.style.background = 'transparent';
          }
        });

        tabContents.forEach(content => {
          const isActive = content.dataset.tabContent === activeTab;
          content.style.display = isActive ? 'block' : 'none';
          content.classList.toggle('active', isActive);
        });

        setTimeout(() => {
          const container = document.getElementById('resumeTabsContainer');
          if (container && btn) {
            const btnOffset = btn.offsetLeft;
            const containerScroll = container.scrollLeft;
            const containerWidth = container.clientWidth;

            if (btnOffset < containerScroll) {
              container.scrollBy({ left: btnOffset - containerScroll - 50, behavior: 'smooth' });
            } else if (btnOffset + btn.offsetWidth > containerScroll + containerWidth) {
              container.scrollBy({ left: btnOffset + btn.offsetWidth - containerScroll - containerWidth + 50, behavior: 'smooth' });
            }
          }
        }, 100);

        updateProgressBar();
      });
    });

    hookInputChangeHandlers();
    setupFormItemButtons();
  };

  const setupFormItemButtons = () => {
    const addExperienceBtn = document.getElementById('addExperienceBtn');
    const addEducationBtn = document.getElementById('addEducationBtn');
    const addProjectBtn = document.getElementById('addProjectBtn');
    const addCertificationBtn = document.getElementById('addCertificationBtn');
    const addAchievementBtn = document.getElementById('addAchievementBtn');
    const addLanguageBtn = document.getElementById('addLanguageBtn');

    addExperienceBtn?.addEventListener('click', () => addFormItem('experience'));
    addEducationBtn?.addEventListener('click', () => addFormItem('education'));
    addProjectBtn?.addEventListener('click', () => addFormItem('project'));
    addCertificationBtn?.addEventListener('click', () => addFormItem('certification'));
    addAchievementBtn?.addEventListener('click', () => addFormItem('achievement'));
    addLanguageBtn?.addEventListener('click', () => addFormItem('language'));

    const generateBtn = document.getElementById('generateResumeBtn');
    const clearBtn = document.getElementById('clearDraftBtn');
    const downloadBtn = document.getElementById('downloadResumeBtn');
    const downloadHtmlBtn = document.getElementById('downloadResumeHtmlBtn');
    const copyBtn = document.getElementById('copyResumeBtn');

    generateBtn?.addEventListener('click', generateResume);
    clearBtn?.addEventListener('click', clearDraft);
    downloadBtn?.addEventListener('click', downloadResumePDF);
    downloadHtmlBtn?.addEventListener('click', downloadResumeHTML);
    copyBtn?.addEventListener('click', copyResume);
  };

  const hookInputChangeHandlers = () => {
    // Add debounced word count updates on text input changes
    const formInputs = [
      'resumeName', 'resumeEmail', 'resumePhone', 'resumeLocation', 'resumeSummary', 'resumeSkills'
    ];

    formInputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        let debounceTimer;
        el.addEventListener('input', () => {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            updateWordCount();
            updateProgressBar();
          }, 300);
        });
      }
    });

    // Watch for mutations in containers (when items are added/removed)
    const containers = [
      'experienceContainer', 'educationContainer', 'projectsContainer',
      'certificationsContainer', 'achievementsContainer', 'languagesContainer'
    ];

    containers.forEach(containerId => {
      const container = document.getElementById(containerId);
      if (container) {
        const observer = new MutationObserver(() => {
          updateWordCount();
          updateProgressBar();
        });
        observer.observe(container, { childList: true, subtree: true, characterData: true });
      }
    });
  };

  // Add form item dynamically
  const addFormItem = (type) => {
    let templateId, containerId;

    switch (type) {
      case 'experience':
        templateId = 'experienceTemplate';
        containerId = 'experienceContainer';
        break;
      case 'education':
        templateId = 'educationTemplate';
        containerId = 'educationContainer';
        break;
      case 'project':
        templateId = 'projectTemplate';
        containerId = 'projectsContainer';
        break;
      case 'certification':
        templateId = 'certificationTemplate';
        containerId = 'certificationsContainer';
        break;
      case 'achievement':
        templateId = 'achievementTemplate';
        containerId = 'achievementsContainer';
        break;
      case 'language':
        templateId = 'languageTemplate';
        containerId = 'languagesContainer';
        break;
      default:
        return;
    }

    const template = document.getElementById(templateId);
    const container = document.getElementById(containerId);

    if (template && container) {
      const clone = template.content.cloneNode(true);
      const item = clone.querySelector('[class$="-item"]');
      
      container.appendChild(clone);

      const removeBtn = item.querySelector('.remove-btn');
      removeBtn?.addEventListener('click', () => {
        item.remove();
        updateProgressBar();
        showNotification('✓ Item removed');
      });

      if (!isRestoringDraft) {
        showNotification(`✓ New ${type} added`);
      }
      updateProgressBar();
    }
  };

  // Generate resume from form
  const generateResume = () => {
    try {
      validatePersonalInfo();
      if (formValidationErrors.length > 0) {
        showNotification('❌ Please fix validation errors first', 3000, 'error');
        return false;
      }

      const name = document.getElementById('resumeName')?.value?.trim() || '';
      const email = document.getElementById('resumeEmail')?.value?.trim() || '';
      const phone = document.getElementById('resumePhone')?.value || '';
      const location = document.getElementById('resumeLocation')?.value || '';
      const summary = document.getElementById('resumeSummary')?.value || '';

      if (!name || !email) {
        showNotification('❌ Name and email are required', 3000, 'error');
        return false;
      }

      const safeSummary = summary.length > 500 ? summary.substring(0, 500) : summary;

      console.log('📊 Collecting form items...');
      const experience = collectFormItems('experience');
      const education = collectFormItems('education');
      const projects = collectFormItems('project');
      const certifications = collectFormItems('certification');
      const achievements = collectFormItems('achievement');
      const skills = (document.getElementById('resumeSkills')?.value || '').split(',').map(s => s.trim()).filter(s => s);
      const languages = collectFormItems('language');

      console.log('📝 Generating HTML...');
      const resumeHTML = generateResumeHTML({
        name, email, phone, location, summary: safeSummary,
        experience, education, skills, projects, certifications, achievements, languages
      });

      const previewDiv = document.getElementById('resumePreview');
      if (previewDiv) {
        previewDiv.innerHTML = resumeHTML;
        console.log('✅ Preview displayed');
      }

      const downloadBtn = document.getElementById('downloadResumeBtn');
      const downloadHtmlBtn = document.getElementById('downloadResumeHtmlBtn');
      const copyBtn = document.getElementById('copyResumeBtn');
      const previewAfterBtn = document.getElementById('previewAfterGenerateBtn');
      const previewBeforeBtn = document.getElementById('previewBeforeSaveBtn');
      
      if (downloadBtn) downloadBtn.style.display = 'block';
      if (downloadHtmlBtn) downloadHtmlBtn.style.display = 'block';
      if (copyBtn) copyBtn.style.display = 'block';
      if (previewAfterBtn) previewAfterBtn.style.display = 'inline-flex';
      if (previewBeforeBtn) previewBeforeBtn.style.display = 'inline-flex';

      showNotification('✅ Resume generated successfully!');
      console.log('✅ generateResume completed');
      return true;
    } catch (error) {
      console.error('❌ Error in generateResume:', error);
      showNotification('❌ Error generating resume: ' + error.message, 3000, 'error');
      return false;
    }
  };

  // Collect form items
  const collectFormItems = (type) => {
    const items = [];
    let selector = '';

    switch (type) {
      case 'experience':
        selector = '.experience-item';
        document.querySelectorAll(selector).forEach(item => {
          items.push({
            title: item.querySelector('.experience-title')?.value || '',
            company: item.querySelector('.experience-company')?.value || '',
            start: item.querySelector('.experience-start')?.value || '',
            end: item.querySelector('.experience-end')?.value || '',
            description: item.querySelector('.experience-description')?.value || ''
          });
        });
        break;
      case 'education':
        selector = '.education-item';
        document.querySelectorAll(selector).forEach(item => {
          items.push({
            school: item.querySelector('.education-school')?.value || '',
            degree: item.querySelector('.education-degree')?.value || '',
            year: item.querySelector('.education-year')?.value || '',
            details: item.querySelector('.education-details')?.value || ''
          });
        });
        break;
      case 'project':
        selector = '.project-item';
        document.querySelectorAll(selector).forEach(item => {
          items.push({
            name: item.querySelector('.project-name')?.value || '',
            tech: item.querySelector('.project-tech')?.value || '',
            url: item.querySelector('.project-url')?.value || '',
            description: item.querySelector('.project-description')?.value || ''
          });
        });
        break;
      case 'certification':
        selector = '.certification-item';
        document.querySelectorAll(selector).forEach(item => {
          items.push({
            name: item.querySelector('.cert-name')?.value || '',
            issuer: item.querySelector('.cert-issuer')?.value || '',
            date: item.querySelector('.cert-date')?.value || '',
            credential: item.querySelector('.cert-credential')?.value || ''
          });
        });
        break;
      case 'achievement':
        selector = '.achievement-item';
        document.querySelectorAll(selector).forEach(item => {
          items.push({
            title: item.querySelector('.achievement-title')?.value || '',
            description: item.querySelector('.achievement-description')?.value || '',
            date: item.querySelector('.achievement-date')?.value || ''
          });
        });
        break;
      case 'language':
        selector = '.language-item';
        document.querySelectorAll(selector).forEach(item => {
          items.push({
            name: item.querySelector('.language-name')?.value || '',
            proficiency: item.querySelector('.language-proficiency')?.value || ''
          });
        });
        break;
    }

    return items.filter(item => Object.values(item).some(v => v));
  };

  // Generate resume HTML
  const generateResumeHTML = (data) => {
    return `
      <div class="resume-document">
        <div class="resume-header">
          <h1>${escapeHtml(data.name)}</h1>
          <div class="resume-contact">
            ${data.email ? `<span>📧 ${escapeHtml(data.email)}</span>` : ''}
            ${data.phone ? `<span>📞 ${escapeHtml(data.phone)}</span>` : ''}
            ${data.location ? `<span>📍 ${escapeHtml(data.location)}</span>` : ''}
          </div>
        </div>

        ${data.summary ? `
          <div class="resume-section">
            <h3>Professional Summary</h3>
            <p>${escapeHtml(data.summary)}</p>
          </div>
        ` : ''}

        ${data.experience.length > 0 ? `
          <div class="resume-section">
            <h3>Work Experience</h3>
            ${data.experience.map(exp => `
              <div class="resume-entry">
                <div class="entry-header">
                  <strong>${escapeHtml(exp.title)}</strong> at <strong>${escapeHtml(exp.company)}</strong>
                  ${exp.start ? `<span class="entry-date">${escapeHtml(exp.start)}${exp.end ? ` - ${escapeHtml(exp.end)}` : ''}</span>` : ''}
                </div>
                ${exp.description ? `<p>${escapeHtml(exp.description)}</p>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${data.education.length > 0 ? `
          <div class="resume-section">
            <h3>Education</h3>
            ${data.education.map(edu => `
              <div class="resume-entry">
                <div class="entry-header">
                  <strong>${escapeHtml(edu.degree)}</strong>
                  ${edu.school ? `from <strong>${escapeHtml(edu.school)}</strong>` : ''}
                  ${edu.year ? `<span class="entry-date">${escapeHtml(edu.year)}</span>` : ''}
                </div>
                ${edu.details ? `<p>${escapeHtml(edu.details)}</p>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${data.skills.length > 0 ? `
          <div class="resume-section">
            <h3>Skills</h3>
            <div class="resume-skills">
              ${data.skills.map(skill => `<span class="skill-tag">${escapeHtml(skill)}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        ${data.projects.length > 0 ? `
          <div class="resume-section">
            <h3>Projects</h3>
            ${data.projects.map(proj => `
              <div class="resume-entry">
                <div class="entry-header">
                  <strong>${escapeHtml(proj.name)}</strong>
                  ${proj.tech ? `<span class="entry-date">${escapeHtml(proj.tech)}</span>` : ''}
                </div>
                ${proj.description ? `<p>${escapeHtml(proj.description)}</p>` : ''}
                ${proj.url ? `<p><a href="${escapeHtml(proj.url)}" target="_blank">🔗 View Project</a></p>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${data.achievements.length > 0 ? `
          <div class="resume-section">
            <h3>Achievements</h3>
            ${data.achievements.map(ach => `
              <div class="resume-entry">
                <div class="entry-header">
                  <strong>${escapeHtml(ach.title)}</strong>
                  ${ach.date ? `<span class="entry-date">${escapeHtml(ach.date)}</span>` : ''}
                </div>
                ${ach.description ? `<p>${escapeHtml(ach.description)}</p>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${data.certifications.length > 0 ? `
          <div class="resume-section">
            <h3>Certifications</h3>
            ${data.certifications.map(cert => `
              <div class="resume-entry">
                <div class="entry-header">
                  <strong>${escapeHtml(cert.name)}</strong> by <strong>${escapeHtml(cert.issuer)}</strong>
                  ${cert.date ? `<span class="entry-date">${escapeHtml(cert.date)}</span>` : ''}
                </div>
                ${cert.credential ? `<p>ID: ${escapeHtml(cert.credential)}</p>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${data.languages.length > 0 ? `
          <div class="resume-section">
            <h3>Languages</h3>
            <div class="resume-skills">
              ${data.languages.map(lang => `
                <span class="skill-tag">${escapeHtml(lang.name)} - ${escapeHtml(lang.proficiency)}</span>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  };

  // LaTeX Handlers
  const initLatexHandlers = () => {
    const latexCode = document.getElementById('latexCode');
    const renderBtn = document.getElementById('renderLatexBtn');
    const downloadBtn = document.getElementById('downloadLatexBtn');

    if (latexCode) {
      latexCode.addEventListener('input', () => {
        clearTimeout(latexRenderTimeout);
        latexRenderTimeout = setTimeout(() => {
          // Optional: Auto-render on input after debounce
        }, RENDER_DEBOUNCE_MS);
      });

      latexCode.addEventListener('paste', () => {
        setTimeout(() => {
          if (latexCode.value.trim()) {
            showNotification('💡 LaTeX code pasted! Click "Render LaTeX" to preview', 2000, 'info');
          }
        }, 100);
      });
    }

    renderBtn?.addEventListener('click', () => {
      const code = document.getElementById('latexCode')?.value || '';
      if (!code.trim()) {
        showNotification('❌ Enter LaTeX code first', 3000, 'error');
        return;
      }

      try {
        const html = convertLatexToHtml(code);
        const preview = document.getElementById('latexPreview');
        const output = document.getElementById('latexOutput');
        const errorDiv = document.getElementById('latexError');

        if (output) output.innerHTML = html;
        if (preview) preview.style.display = 'block';
        if (errorDiv) errorDiv.style.display = 'none';

        showNotification('✅ LaTeX rendered successfully');
        console.log('✅ LaTeX preview generated');
      } catch (error) {
        const errorDiv = document.getElementById('latexError');
        if (errorDiv) {
          errorDiv.style.display = 'block';
          errorDiv.innerHTML = `⚠️ Rendering Error: ${error.message}`;
        }
        showNotification('❌ LaTeX rendering error: ' + error.message, 3000, 'error');
      }
    });

    downloadBtn?.addEventListener('click', () => {
      const latexCode = document.getElementById('latexCode')?.value || '';
      if (!latexCode.trim()) {
        showNotification('❌ Enter LaTeX code first', 3000, 'error');
        return;
      }
      downloadAsFile(latexCode, 'resume.tex', 'text/plain');
      showNotification('✅ LaTeX file downloaded');
    });
  };

  // Convert LaTeX to HTML
  const convertLatexToHtml = (latex) => {
    let html = escapeHtml(latex);
    
    html = html.replace(/\\documentclass\{.*?\}/g, '');
    html = html.replace(/\\usepackage\{.*?\}/g, '');
    html = html.replace(/\\begin\{document\}/g, '');
    html = html.replace(/\\end\{document\}/g, '');
    html = html.replace(/\\title\{(.*?)\}/g, '<h2>$1</h2>');
    html = html.replace(/\\author\{(.*?)\}/g, '<p><strong>Author:</strong> $1</p>');
    html = html.replace(/\\section\{(.*?)\}/g, '<h3>$1</h3>');
    html = html.replace(/\\subsection\{(.*?)\}/g, '<h4>$1</h4>');
    html = html.replace(/\\textbf\{(.*?)\}/g, '<strong>$1</strong>');
    html = html.replace(/\\textit\{(.*?)\}/g, '<em>$1</em>');
    html = html.replace(/\\underline\{(.*?)\}/g, '<u>$1</u>');
    html = html.replace(/\\emph\{(.*?)\}/g, '<em>$1</em>');
    html = html.replace(/\\\\(?!\w)/g, '<br>');
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    
    return `<div style="white-space: pre-wrap; word-wrap: break-word; font-family: 'Georgia', serif; line-height: 1.8; padding: 1rem;">${html}</div>`;
  };

  // Save draft to localStorage
  const saveDraft = () => {
    try {
      const formData = {
        name: document.getElementById('resumeName')?.value || '',
        email: document.getElementById('resumeEmail')?.value || '',
        phone: document.getElementById('resumePhone')?.value || '',
        location: document.getElementById('resumeLocation')?.value || '',
        summary: document.getElementById('resumeSummary')?.value || '',
        skills: document.getElementById('resumeSkills')?.value || '',
        latex: document.getElementById('latexCode')?.value || '',
        experience: collectFormItems('experience'),
        education: collectFormItems('education'),
        projects: collectFormItems('project'),
        certifications: collectFormItems('certification'),
        achievements: collectFormItems('achievement'),
        languages: collectFormItems('language'),
        timestamp: new Date().toISOString()
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      console.log('✅ Draft saved successfully');
      updateSaveStatus(new Date());
      return true;
    } catch (error) {
      console.error('❌ Error saving draft:', error);
      showNotification('⚠️ Could not save draft: ' + error.message, 3000, 'error');
      return false;
    }
  };

  // Load draft from localStorage
  const loadDraft = () => {
    try {
      const draft = localStorage.getItem(STORAGE_KEY);
      if (!draft) {
        updateSaveStatus(null);
        showNotification('ℹ️ No saved draft found', 2000, 'info');
        return false;
      }

      console.log('📂 Loading draft from storage...');
      const data = JSON.parse(draft);

      const fields = ['name', 'email', 'phone', 'location', 'summary', 'skills', 'latex'];
      fields.forEach(field => {
        const el = document.getElementById(field === 'latex' ? 'latexCode' : `resume${field.charAt(0).toUpperCase() + field.slice(1)}`);
        if (el && data[field]) {
          el.value = data[field];
        }
      });

      if (data.experience?.length) {
        data.experience.forEach((exp) => {
          addFormItem('experience');
          setTimeout(() => {
            const items = document.querySelectorAll('.experience-item');
            const lastItem = items[items.length - 1];
            if (lastItem) {
              lastItem.querySelector('.experience-title').value = exp.title || '';
              lastItem.querySelector('.experience-company').value = exp.company || '';
              lastItem.querySelector('.experience-start').value = exp.start || '';
              lastItem.querySelector('.experience-end').value = exp.end || '';
              lastItem.querySelector('.experience-description').value = exp.description || '';
            }
          }, 50);
        });
      }

      const typeConfigs = [
        { key: 'education', btn: 'addEducationBtn', selector: '.education-item', fields: { school: '.education-school', degree: '.education-degree', year: '.education-year', details: '.education-details' }},
        { key: 'projects', btn: 'addProjectBtn', selector: '.project-item', fields: { name: '.project-name', tech: '.project-tech', url: '.project-url', description: '.project-description' }},
        { key: 'certifications', btn: 'addCertificationBtn', selector: '.certification-item', fields: { name: '.cert-name', issuer: '.cert-issuer', date: '.cert-date', credential: '.cert-credential' }},
        { key: 'achievements', btn: 'addAchievementBtn', selector: '.achievement-item', fields: { title: '.achievement-title', description: '.achievement-description', date: '.achievement-date' }},
        { key: 'languages', btn: 'addLanguageBtn', selector: '.language-item', fields: { name: '.language-name', proficiency: '.language-proficiency' }}
      ];

      isRestoringDraft = true;
      typeConfigs.forEach(config => {
        if (data[config.key]?.length) {
          data[config.key].forEach((item) => {
            addFormItem(config.key.slice(0, -1));
            setTimeout(() => {
              const items = document.querySelectorAll(config.selector);
              const lastItem = items[items.length - 1];
              if (lastItem) {
                Object.entries(config.fields).forEach(([key, selector]) => {
                  const el = lastItem.querySelector(selector);
                  if (el && item[key]) {
                    el.value = item[key];
                  }
                });
              }
            }, 50);
          });
        }
      });

      isRestoringDraft = false;
      showNotification('📂 Draft loaded successfully!');

      if (data.timestamp) {
        const ts = new Date(data.timestamp);
        if (!Number.isNaN(ts.getTime())) {
          updateSaveStatus(ts);
        }
      }

      updateProgressBar();
      return true;
    } catch (error) {
      console.error('❌ Error loading draft:', error);
      showNotification('❌ Error loading draft: ' + error.message, 3000, 'error');
      return false;
    }
  };

  // Clear draft
  const clearDraft = () => {
    if (!confirm('Are you sure? This will clear all your form data.')) {
      return false;
    }

    try {
      const fields = ['resumeName', 'resumeEmail', 'resumePhone', 'resumeLocation', 'resumeSummary', 'resumeSkills', 'latexCode'];
      fields.forEach(field => {
        const el = document.getElementById(field);
        if (el) el.value = '';
      });

      const containers = ['experienceContainer', 'educationContainer', 'projectsContainer', 'certificationsContainer', 'achievementsContainer', 'languagesContainer'];
      containers.forEach(id => {
        const container = document.getElementById(id);
        if (container) container.innerHTML = '';
      });

      localStorage.removeItem(STORAGE_KEY);
      
      const preview = document.getElementById('resumePreview');
      if (preview) {
        preview.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Click "Generate Resume" to see preview</p>';
      }

      const downloadBtn = document.getElementById('downloadResumeBtn');
      const copyBtn = document.getElementById('copyResumeBtn');
      if (downloadBtn) downloadBtn.style.display = 'none';
      if (copyBtn) copyBtn.style.display = 'none';

      const latexPreview = document.getElementById('latexPreview');
      if (latexPreview) latexPreview.style.display = 'none';

      updateSaveStatus(null);
      updateProgressBar();
      showNotification('🗑️ Draft cleared successfully', 2000);
      return true;
    } catch (error) {
      console.error('❌ Error clearing draft:', error);
      showNotification('❌ Error clearing draft: ' + error.message, 3000, 'error');
      return false;
    }
  };

  // Download resume as PDF
  const downloadResumePDF = () => {
    try {
      const preview = document.getElementById('resumePreview');
      if (!preview || !preview.querySelector('.resume-document')) {
        showNotification('❌ Generate resume first', 3000, 'error');
        return false;
      }

      const name = document.getElementById('resumeName')?.value || 'resume';
      const filename = `${name.replace(/\s+/g, '_')}_resume.pdf`;
      
      // Use html2pdf library
      const element = preview.querySelector('.resume-document');
      const opt = {
        margin: [10, 10, 10, 10],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, logging: false },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
      };

      if (typeof html2pdf !== 'undefined') {
        html2pdf().set(opt).from(element).save();
        showNotification('✅ Resume downloaded as PDF');
        return true;
      } else {
        showNotification('⚠️ PDF library not loaded. Downloading as HTML instead.', 3000, 'warning');
        downloadResumeHTML();
        return true;
      }
    } catch (error) {
      console.error('❌ Error downloading PDF:', error);
      showNotification('❌ PDF download failed: ' + error.message, 3000, 'error');
      return false;
    }
  };

  // Download resume as HTML
  const downloadResumeHTML = () => {
    try {
      const preview = document.getElementById('resumePreview');
      if (!preview || !preview.querySelector('.resume-document')) {
        showNotification('❌ Generate resume first', 3000, 'error');
        return false;
      }

      const name = document.getElementById('resumeName')?.value || 'resume';
      const filename = `${name.replace(/\s+/g, '_')}_resume.html`;
      const html = preview.innerHTML;

      downloadAsFile(html, filename, 'text/html');
      showNotification('✅ Resume downloaded as HTML');
      return true;
    } catch (error) {
      console.error('❌ Error downloading resume:', error);
      showNotification('❌ Download failed: ' + error.message, 3000, 'error');
      return false;
    }
  };

  // Download resume
  const downloadResume = downloadResumePDF; // Default to PDF

  // Copy resume text
  const copyResume = () => {
    try {
      const preview = document.getElementById('resumePreview');
      if (!preview || !preview.querySelector('.resume-document')) {
        showNotification('❌ Generate resume first', 3000, 'error');
        return false;
      }

      const text = preview.innerText;
      navigator.clipboard.writeText(text).then(() => {
        showNotification('✅ Resume copied to clipboard');
      }).catch((err) => {
        showNotification('❌ Copy failed: ' + err.message, 3000, 'error');
      });
      return true;
    } catch (error) {
      console.error('❌ Error copying resume:', error);
      showNotification('❌ Error copying: ' + error.message, 3000, 'error');
      return false;
    }
  };

  // Helper functions
  const escapeHtml = (text) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  };

  const downloadAsFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const showNotification = (message, duration = 2000, type = 'success') => {
    const toast = document.getElementById('toast');
    if (!toast) {
      console.warn('⚠️ Toast element not found. Message:', message);
      alert(message);
      return;
    }
    
    toast.textContent = message;
    toast.style.display = 'block';
    toast.style.opacity = '1';
    toast.setAttribute('aria-hidden', 'false');

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => {
        toast.style.display = 'none';
        toast.style.transition = '';
      }, 300);
    }, duration);
  };

  return {
    init,
    generateResume,
    saveDraft,
    loadDraft,
    clearDraft
  };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('page-resume')) {
      ResumeManager.init();
    }
  });
} else {
  if (document.getElementById('page-resume')) {
    ResumeManager.init();
  }
}
