// Storage Module - Manages all localStorage operations with persistence and expiration support
const StorageManager = (() => {
  const STORAGE_KEY = 'linkforge_urls';
  const ANALYTICS_KEY = 'linkforge_analytics';

  const getLinks = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  };

  const storeLink = (code, originalUrl, options = {}) => {
    const links = getLinks();
    const expiresAt = options.expiryDays ? Date.now() + (options.expiryDays * 86400000) : null;
    links.unshift({ code, originalUrl, createdAt: new Date().toISOString(), expiresAt, customCode: !!options.isCustom });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
    Analytics.recordLinkCreated(code);
  };

  const getLink = (code) => getLinks().find(l => l.code === code && (!l.expiresAt || l.expiresAt > Date.now()));

  const deleteLink = (code) => {
    const links = getLinks().filter(l => l.code !== code);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
    Analytics.recordLinkDeleted(code);
  };

  const updateAnalytics = (code) => {
    const links = getLinks();
    const link = links.find(l => l.code === code);
    if (link) {
      link.clicks = (link.clicks || 0) + 1;
      link.lastAccess = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
      Analytics.recordLinkClick(code);
    }
  };

  const getAnalytics = () => {
    try {
      return JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '{}');
    } catch { return {}; }
  };

  return { getLinks, storeLink, getLink, deleteLink, updateAnalytics, getAnalytics };
})();

// Analytics Module - Tracks usage stats
const Analytics = (() => {
  const getStats = () => StorageManager.getAnalytics();

  const recordLinkCreated = (code) => {
    const stats = getStats();
    stats.totalCreated = (stats.totalCreated || 0) + 1;
    stats.lastCreated = new Date().toISOString();
    localStorage.setItem('linkforge_analytics', JSON.stringify(stats));
  };

  const recordLinkClick = (code) => {
    const stats = getStats();
    stats.totalClicks = (stats.totalClicks || 0) + 1;
    stats.lastClick = new Date().toISOString();
    localStorage.setItem('linkforge_analytics', JSON.stringify(stats));
  };

  const recordLinkDeleted = (code) => {
    const stats = getStats();
    stats.totalDeleted = (stats.totalDeleted || 0) + 1;
    localStorage.setItem('linkforge_analytics', JSON.stringify(stats));
  };

  return { getStats, recordLinkCreated, recordLinkClick, recordLinkDeleted };
})();

// Utility Functions Module
const Utils = (() => {
  const generateShortCode = (length = 6) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array).map(i => chars[i % chars.length]).join('');
  };

  const generateCustomCode = (input) => {
    return input.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20) || generateShortCode();
  };

  const isValidUrl = (string) => {
    try {
      const url = new URL(string);
      return ['http:', 'https:'].includes(url.protocol);
    } catch { return false; }
  };

  const showToast = (message) => {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      toast.setAttribute('role', 'alert');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('✓ Copied to clipboard!');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('✓ Copied to clipboard!');
    }
  };

  const formatDate = (isoString) => new Date(isoString).toLocaleDateString();

  return { generateShortCode, generateCustomCode, isValidUrl, showToast, copyToClipboard, formatDate };
})();
