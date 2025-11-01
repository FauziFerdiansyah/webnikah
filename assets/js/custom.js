/*
===========================================
CUSTOM.JS - PROJECT SPECIFIC FUNCTIONALITY
===========================================
File ini berisi:
1. Music player dengan animasi vinyl disc
2. Custom animations dan interactions
3. RSVP form handling
4. Smooth scrolling optimizations
5. Performance optimizations khusus proyek
===========================================
*/

/**
 * MUSIC PLAYER MANAGER
 * Mengelola pemutaran musik dengan animasi vinyl disc
 */
const MusicPlayerManager = {
  // Audio element dan state
  audio: null,
  isPlaying: false,
  isInitialized: false,
  vinylElement: null,
  playerButton: null,
  
  // Configuration
  config: {
    audioPath: '/Users/fauzifr/Documents/fauzidev/develop/wedding-web/web-main/assets/music/10cm-lovely-runner-spring-snow-karaoke-version-yumiella-dolkness-1749456684-412d8f467971a1df1265b76b.mp3',
    volume: 0.7,
    fadeInDuration: 2000,
    fadeOutDuration: 1000,
    autoPlay: true,
    loop: true
  },
  
  /**
   * Initialize music player
   */
  init() {
    console.log('🎵 Initializing music player...');
    
    try {
      // Create audio element
      this.createAudioElement();
      
      // Create player UI
      // this.createPlayerUI();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Setup audio events
      this.setupAudioEvents();
      
      // Auto play jika diizinkan
      this.handleAutoPlay();
      
      this.isInitialized = true;
      console.log('✅ Music player initialized successfully');
      
    } catch (error) {
      console.error('❌ Music player initialization failed:', error);
    }
  },
  
  /**
   * Create audio element dengan optimasi
   */
  createAudioElement() {
    this.audio = new Audio();
    this.audio.src = this.config.audioPath;
    this.audio.volume = this.config.volume;
    this.audio.loop = this.config.loop;
    this.audio.preload = 'metadata'; // Preload metadata saja untuk performa
    
    // Optimasi untuk mobile
    this.audio.setAttribute('playsinline', true);
    this.audio.setAttribute('webkit-playsinline', true);
  },
  
  /**
   * Create player UI elements
   */
  createPlayerUI() {
    // Create main container
    const playerContainer = document.createElement('div');
    playerContainer.className = 'music-player';
    playerContainer.setAttribute('aria-label', 'Music Player');
    
    // Create player button
    this.playerButton = document.createElement('button');
    this.playerButton.className = 'music-player-btn';
    this.playerButton.setAttribute('aria-label', 'Toggle Music');
    this.playerButton.setAttribute('title', 'Click to play/pause music');
    
    // Create vinyl disc
    this.vinylElement = document.createElement('div');
    this.vinylElement.className = 'vinyl-disc playing'; // Start dengan playing state
    
    // Assemble UI
    this.playerButton.appendChild(this.vinylElement);
    playerContainer.appendChild(this.playerButton);
    
    // Add to DOM
    document.body.appendChild(playerContainer);
    
    console.log('🎨 Music player UI created');
  },
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Player button click
    this.playerButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggle();
    });
    
    // Keyboard accessibility
    this.playerButton.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggle();
      }
    });
    
    // Page visibility change (pause saat tab tidak aktif)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.isPlaying) {
        this.pause(false); // Pause tanpa mengubah UI state
      } else if (!document.hidden && this.isPlaying) {
        this.play(false); // Resume tanpa mengubah UI state
      }
    });
    
    // Handle page unload
    window.addEventListener('beforeunload', () => {
      if (this.audio) {
        this.audio.pause();
      }
    });
  },
  
  /**
   * Setup audio event listeners
   */
  setupAudioEvents() {
    // Audio loaded
    this.audio.addEventListener('loadedmetadata', () => {
      console.log('🎵 Audio metadata loaded');
    });
    
    this.audio.addEventListener('canplaythrough', () => {
      console.log('🎵 Audio can play through');
    });
    
    // Audio play/pause events
    this.audio.addEventListener('play', () => {
      console.log('▶️ Audio started playing');
      this.updatePlayingState(true);
    });
    
    this.audio.addEventListener('pause', () => {
      console.log('⏸️ Audio paused');
      this.updatePlayingState(false);
    });
    
    // Audio ended (jika tidak loop)
    this.audio.addEventListener('ended', () => {
      console.log('🔚 Audio ended');
      this.updatePlayingState(false);
    });
    
    // Error handling
    this.audio.addEventListener('error', (e) => {
      console.error('❌ Audio error:', e);
      this.handleAudioError(e);
    });
    
    // Loading events
    this.audio.addEventListener('loadstart', () => {
      console.log('⏳ Audio loading started');
    });
    
    this.audio.addEventListener('waiting', () => {
      console.log('⏳ Audio buffering');
    });
  },
  
  /**
   * Handle auto play dengan user interaction detection
   */
  async handleAutoPlay() {
    if (!this.config.autoPlay) return;
    
    try {
      // Coba auto play
      await this.play(true);
      console.log('🎵 Auto play successful');
      
    } catch (error) {
      console.log('🎵 Auto play blocked, waiting for user interaction');
      
      // Setup one-time user interaction listener
      const enableAudioOnInteraction = async () => {
        try {
          await this.play(true);
          console.log('🎵 Audio enabled after user interaction');
          
          // Remove listeners setelah berhasil
          document.removeEventListener('click', enableAudioOnInteraction);
          document.removeEventListener('touchstart', enableAudioOnInteraction);
          document.removeEventListener('keydown', enableAudioOnInteraction);
          
        } catch (err) {
          console.error('❌ Failed to enable audio:', err);
        }
      };
      
      // Listen untuk user interaction
      document.addEventListener('click', enableAudioOnInteraction, { once: true });
      document.addEventListener('touchstart', enableAudioOnInteraction, { once: true });
      document.addEventListener('keydown', enableAudioOnInteraction, { once: true });
    }
  },
  
  /**
   * Play audio dengan fade in effect
   */
  async play(updateUI = true) {
    if (!this.audio) return;
    
    try {
      // Set volume ke 0 untuk fade in
      this.audio.volume = 0;
      
      // Play audio
      await this.audio.play();
      
      // Fade in effect
      this.fadeIn();
      
      if (updateUI) {
        this.isPlaying = true;
        this.updatePlayingState(true);
      }
      
    } catch (error) {
      console.error('❌ Play failed:', error);
      throw error;
    }
  },
  
  /**
   * Pause audio dengan fade out effect
   */
  pause(updateUI = true) {
    if (!this.audio) return;
    
    // Fade out kemudian pause
    this.fadeOut(() => {
      this.audio.pause();
      
      if (updateUI) {
        this.isPlaying = false;
        this.updatePlayingState(false);
      }
    });
  },
  
  /**
   * Toggle play/pause
   */
  toggle() {
    if (!this.isInitialized) {
      console.warn('⚠️ Music player not initialized');
      return;
    }
    
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  },
  
  /**
   * Update playing state dan UI
   */
  updatePlayingState(playing) {
    this.isPlaying = playing;
    
    if (this.vinylElement) {
      if (playing) {
        this.vinylElement.classList.add('playing');
        this.playerButton.setAttribute('aria-label', 'Pause Music');
        this.playerButton.setAttribute('title', 'Click to pause music');
      } else {
        this.vinylElement.classList.remove('playing');
        this.playerButton.setAttribute('aria-label', 'Play Music');
        this.playerButton.setAttribute('title', 'Click to play music');
      }
    }
  },
  
  /**
   * Fade in effect
   */
  fadeIn() {
    if (!this.audio) return;
    
    const targetVolume = this.config.volume;
    const duration = this.config.fadeInDuration;
    const steps = 60; // 60 steps untuk smooth fade
    const stepDuration = duration / steps;
    const volumeStep = targetVolume / steps;
    
    let currentStep = 0;
    
    const fadeInterval = setInterval(() => {
      currentStep++;
      const newVolume = Math.min(volumeStep * currentStep, targetVolume);
      this.audio.volume = newVolume;
      
      if (currentStep >= steps || newVolume >= targetVolume) {
        clearInterval(fadeInterval);
        this.audio.volume = targetVolume;
      }
    }, stepDuration);
  },
  
  /**
   * Fade out effect
   */
  fadeOut(callback) {
    if (!this.audio) return;
    
    const initialVolume = this.audio.volume;
    const duration = this.config.fadeOutDuration;
    const steps = 30; // 30 steps untuk fade out
    const stepDuration = duration / steps;
    const volumeStep = initialVolume / steps;
    
    let currentStep = 0;
    
    const fadeInterval = setInterval(() => {
      currentStep++;
      const newVolume = Math.max(initialVolume - (volumeStep * currentStep), 0);
      this.audio.volume = newVolume;
      
      if (currentStep >= steps || newVolume <= 0) {
        clearInterval(fadeInterval);
        this.audio.volume = 0;
        if (callback) callback();
      }
    }, stepDuration);
  },
  
  /**
   * Handle audio errors
   */
  handleAudioError(error) {
    console.error('🚨 Audio error occurred:', error);
    
    // Update UI untuk error state
    if (this.vinylElement) {
      this.vinylElement.classList.remove('playing');
      this.vinylElement.style.opacity = '0.5';
    }
    
    if (this.playerButton) {
      this.playerButton.setAttribute('title', 'Audio unavailable');
      this.playerButton.disabled = true;
    }
    
    this.isPlaying = false;
  }
};

/**
 * COUNTDOWN MANAGER
 * Mengelola countdown timer dengan efek fade yang smooth
 */
  const CountdownManager = {
    targetDate: null,
    countdownInterval: null,
    elements: {
      days: null,
      hours: null,
      minutes: null,
      seconds: null
    },
    
    /**
   * Initialize countdown
   */
  init() {
    console.log('⏰ Initializing countdown manager...');
    
    // Get countdown container
    const countdownContainer = document.querySelector('.countdown');
    if (!countdownContainer) {
      console.warn('⚠️ Countdown container not found');
      return;
    }
    
    // Get target date from data attribute or use default
    const targetDateStr = countdownContainer.dataset.targetDate || '2025-11-23T10:00:00+07:00';
    this.targetDate = new Date(targetDateStr);
    
    // Validate target date
    if (isNaN(this.targetDate.getTime())) {
      console.error('❌ Invalid target date:', targetDateStr);
      return;
    }
    
    // Get countdown elements
    this.elements.days = document.querySelector('.count-day');
    this.elements.hours = document.querySelector('.count-hour');
    this.elements.minutes = document.querySelector('.count-minute');
    this.elements.seconds = document.querySelector('.count-second');
    
    // Check if elements exist
    if (!this.elements.days || !this.elements.hours || !this.elements.minutes || !this.elements.seconds) {
      console.warn('⚠️ Countdown elements not found');
      return;
    }
    
    // Start countdown
    this.startCountdown();
    
    console.log('✅ Countdown manager initialized for:', this.targetDate.toLocaleString('id-ID'));
  },
    
    /**
     * Start countdown timer
     */
    startCountdown() {
      // Update immediately
      this.updateCountdown();
      
      // Update every second
      this.countdownInterval = setInterval(() => {
        this.updateCountdown();
      }, 1000);
    },
    
    /**
     * Update countdown display
     */
    updateCountdown() {
      const now = new Date().getTime();
      const distance = this.targetDate.getTime() - now;
      
      // Check if countdown is finished
      if (distance < 0) {
        this.handleCountdownFinished();
        return;
      }
      
      // Calculate time units
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      // Update display with fade effect
      this.updateWithFade(this.elements.days, days);
      this.updateWithFade(this.elements.hours, hours);
      this.updateWithFade(this.elements.minutes, minutes);
      this.updateWithFade(this.elements.seconds, seconds);
    },
    
    /**
     * Update element with fade effect
     */
    updateWithFade(element, newValue) {
      const currentValue = element.textContent;
      const newValueStr = newValue.toString().padStart(2, '0');
      
      // Only update if value changed
      if (currentValue !== newValueStr) {
        // Add fade out class
        element.style.opacity = '0.3';
        element.style.transform = 'scale(0.9)';
        
        // Update value after short delay
        setTimeout(() => {
          element.textContent = newValueStr;
          
          // Fade back in
          element.style.opacity = '1';
          element.style.transform = 'scale(1)';
        }, 150);
      }
    },
    
    /**
     * Handle countdown finished
     */
    handleCountdownFinished() {
      console.log('🎉 Countdown finished!');
      
      // Clear interval
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }
      
      // Set all to 00 with fade effect
      this.updateWithFade(this.elements.days, 0);
      this.updateWithFade(this.elements.hours, 0);
      this.updateWithFade(this.elements.minutes, 0);
      this.updateWithFade(this.elements.seconds, 0);
      
      // Add finished class for special styling
      const countdownContainer = document.querySelector('.countdown');
      if (countdownContainer) {
        countdownContainer.classList.add('countdown-finished');
      }
    },
    
    /**
     * Cleanup countdown
     */
    destroy() {
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }
    }
};

/* SMOOTH SCROLL MANAGER
 * Mengelola smooth scrolling dengan optimasi performa
 */
const SmoothScrollManager = {
  isScrolling: false,
  scrollTimeout: null,
  
  /**
   * Initialize smooth scroll optimizations
   */
  init() {
    console.log('📜 Initializing smooth scroll optimizations...');
    
    // Setup scroll event optimization
    this.setupScrollOptimization();
    
    // Setup smooth scroll untuk anchor links
    this.setupAnchorScrolling();
    
    // Setup scroll-based animations
    this.setupScrollAnimations();
    
    console.log('✅ Smooth scroll optimizations initialized');
  },
  
  /**
   * Setup scroll event optimization dengan throttling
   */
  setupScrollOptimization() {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.onScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
    
    // Passive listener untuk performa
    window.addEventListener('scroll', handleScroll, { passive: true });
  },
  
  /**
   * Handle scroll events
   */
  onScroll() {
    // Mark scrolling state
    this.isScrolling = true;
    
    // Clear timeout
    clearTimeout(this.scrollTimeout);
    
    // Set timeout untuk end of scroll
    this.scrollTimeout = setTimeout(() => {
      this.isScrolling = false;
      this.onScrollEnd();
    }, 150);
    
    // Update scroll-based elements
    this.updateScrollElements();
  },
  
  /**
   * Handle scroll end
   */
  onScrollEnd() {
    console.log('📜 Scroll ended');
    
    // Refresh AOS jika tersedia
    if (typeof AOS !== 'undefined') {
      AOS.refresh();
    }
  },
  
  /**
   * Update elements berdasarkan scroll position
   */
  updateScrollElements() {
    const scrollY = window.pageYOffset;
    const windowHeight = window.innerHeight;
    
    // Update parallax elements (jika ada)
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    parallaxElements.forEach(element => {
      const speed = parseFloat(element.dataset.parallax) || 0.5;
      const yPos = -(scrollY * speed);
      element.style.transform = `translate3d(0, ${yPos}px, 0)`;
    });
    
    // Update scroll progress (jika ada)
    const progressElements = document.querySelectorAll('[data-scroll-progress]');
    progressElements.forEach(element => {
      const progress = Math.min(scrollY / (document.body.scrollHeight - windowHeight), 1);
      element.style.setProperty('--scroll-progress', progress);
    });
  },
  
  /**
   * Setup smooth scrolling untuk anchor links
   */
  setupAnchorScrolling() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      
      const targetId = link.getAttribute('href').substring(1);
      if (!targetId) return;
      
      const targetElement = document.getElementById(targetId);
      if (!targetElement) return;
      
      e.preventDefault();
      this.scrollToElement(targetElement);
    });
  },
  
  /**
   * Smooth scroll ke element tertentu
   */
  scrollToElement(element, offset = 0) {
    const targetPosition = element.offsetTop - offset;
    
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
  },
  
  /**
   * Setup scroll-based animations
   */
  setupScrollAnimations() {
    // Intersection Observer untuk scroll animations
    const observerOptions = {
      threshold: [0, 0.25, 0.5, 0.75, 1],
      rootMargin: '0px 0px -10% 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const element = entry.target;
        const ratio = entry.intersectionRatio;
        
        // Update custom properties berdasarkan intersection ratio
        element.style.setProperty('--intersection-ratio', ratio);
        
        // Add/remove classes berdasarkan visibility
        if (ratio > 0.1) {
          element.classList.add('in-view');
        } else {
          element.classList.remove('in-view');
        }
      });
    }, observerOptions);
    
    // Observe elements dengan data-scroll-animate
    document.querySelectorAll('[data-scroll-animate]').forEach(element => {
      observer.observe(element);
    });
  }
};

/**
 * RSVP FORM MANAGER
 * Mengelola form RSVP dengan validasi dan animasi
 */
const RSVPFormManager = {
  form: null,
  isSubmitting: false,
  
  /**
   * Initialize RSVP form
   */
  init() {
    console.log('📝 Initializing RSVP form...');
    
    this.form = document.getElementById('rsvp-form');
    if (!this.form) {
      console.warn('⚠️ RSVP form not found');
      return;
    }
    
    // Setup form events
    this.setupFormEvents();
    
    // Setup form validation
    this.setupFormValidation();
    
    // Setup form animations
    this.setupFormAnimations();
    
    console.log('✅ RSVP form initialized');
  },
  
  /**
   * Setup form event listeners
   */
  setupFormEvents() {
    // Form submit
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
    
    // Real-time validation
    const inputs = this.form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => this.clearFieldError(input));
    });
  },
  
  /**
   * Setup form validation
   */
  setupFormValidation() {
    // Custom validation messages
    this.validationMessages = {
      required: 'Field ini wajib diisi',
      email: 'Format email tidak valid',
      minLength: 'Minimal {min} karakter',
      maxLength: 'Maksimal {max} karakter'
    };
  },
  
  /**
   * Setup form animations
   */
  setupFormAnimations() {
    // Animate form fields on focus
    const inputs = this.form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        input.parentElement.classList.add('focused');
      });
      
      input.addEventListener('blur', () => {
        if (!input.value) {
          input.parentElement.classList.remove('focused');
        }
      });
    });
  },
  
  /**
   * Handle form submission
   */
  async handleSubmit() {
    if (this.isSubmitting) return;
    
    console.log('📤 Submitting RSVP form...');
    
    // Validate form
    if (!this.validateForm()) {
      console.warn('⚠️ Form validation failed');
      return;
    }
    
    this.isSubmitting = true;
    this.showSubmittingState();
    
    try {
      // Simulate form submission (replace dengan actual API call)
      await this.simulateSubmission();
      
      // Show success message
      this.showSuccessMessage();
      
      console.log('✅ RSVP submitted successfully');
      
    } catch (error) {
      console.error('❌ RSVP submission failed:', error);
      this.showErrorMessage();
      
    } finally {
      this.isSubmitting = false;
      this.hideSubmittingState();
    }
  },
  
  /**
   * Validate entire form
   */
  validateForm() {
    const inputs = this.form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });
    
    return isValid;
  },
  
  /**
   * Validate individual field
   */
  validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name || field.id;
    let isValid = true;
    let errorMessage = '';
    
    // Required validation
    if (field.hasAttribute('required') && !value) {
      isValid = false;
      errorMessage = this.validationMessages.required;
    }
    
    // Email validation
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        errorMessage = this.validationMessages.email;
      }
    }
    
    // Length validation
    if (field.hasAttribute('minlength') && value.length < parseInt(field.getAttribute('minlength'))) {
      isValid = false;
      errorMessage = this.validationMessages.minLength.replace('{min}', field.getAttribute('minlength'));
    }
    
    if (field.hasAttribute('maxlength') && value.length > parseInt(field.getAttribute('maxlength'))) {
      isValid = false;
      errorMessage = this.validationMessages.maxLength.replace('{max}', field.getAttribute('maxlength'));
    }
    
    // Show/hide error
    if (isValid) {
      this.clearFieldError(field);
    } else {
      this.showFieldError(field, errorMessage);
    }
    
    return isValid;
  },
  
  /**
   * Show field error
   */
  showFieldError(field, message) {
    field.classList.add('error');
    
    // Remove existing error message
    const existingError = field.parentElement.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }
    
    // Add new error message
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    field.parentElement.appendChild(errorElement);
  },
  
  /**
   * Clear field error
   */
  clearFieldError(field) {
    field.classList.remove('error');
    
    const errorMessage = field.parentElement.querySelector('.error-message');
    if (errorMessage) {
      errorMessage.remove();
    }
  },
  
  /**
   * Show submitting state
   */
  showSubmittingState() {
    const submitButton = this.form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Mengirim...';
      submitButton.classList.add('submitting');
    }
  },
  
  /**
   * Hide submitting state
   */
  hideSubmittingState() {
    const submitButton = this.form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Kirim RSVP';
      submitButton.classList.remove('submitting');
    }
  },
  
  /**
   * Show success message
   */
  showSuccessMessage() {
    const message = document.createElement('div');
    message.className = 'success-message';
    message.innerHTML = `
      <h4>✅ RSVP Berhasil Dikirim!</h4>
      <p>Terima kasih atas konfirmasi kehadiran Anda.</p>
    `;
    
    this.form.parentElement.insertBefore(message, this.form);
    this.form.style.display = 'none';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      message.remove();
      this.form.style.display = 'block';
      this.form.reset();
    }, 5000);
  },
  
  /**
   * Show error message
   */
  showErrorMessage() {
    const message = document.createElement('div');
    message.className = 'error-message-global';
    message.innerHTML = `
      <h4>❌ Terjadi Kesalahan</h4>
      <p>Mohon coba lagi dalam beberapa saat.</p>
    `;
    
    this.form.parentElement.insertBefore(message, this.form);
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      message.remove();
    }, 3000);
  },
  
  /**
   * Simulate form submission
   */
  simulateSubmission() {
    return new Promise((resolve) => {
      setTimeout(resolve, 2000); // Simulate 2 second delay
    });
  }
};

/**
 * PERFORMANCE OPTIMIZER
 * Optimasi performa khusus untuk proyek ini
 */
const PerformanceOptimizer = {
  /**
   * Initialize performance optimizations
   */
  init() {
    console.log('⚡ Initializing performance optimizations...');
    
    // Setup image lazy loading
    this.setupImageLazyLoading();
    
    // Setup resource hints
    this.setupResourceHints();
    
    // Setup critical resource prioritization
    this.setupResourcePrioritization();
    
    // Setup memory management
    this.setupMemoryManagement();
    
    console.log('✅ Performance optimizations initialized');
  },
  
  /**
   * Setup image lazy loading
   */
  setupImageLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.classList.add('loaded');
              imageObserver.unobserve(img);
            }
          }
        });
      });
      
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  },
  
  /**
   * Setup resource hints
   */
  setupResourceHints() {
    // Preconnect ke external domains
    const preconnectDomains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://unpkg.com'
    ];
    
    preconnectDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      document.head.appendChild(link);
    });
  },
  
  /**
   * Setup resource prioritization
   */
  setupResourcePrioritization() {
    // Prioritize critical resources
    const criticalResources = document.querySelectorAll('link[rel="stylesheet"], script[src]');
    criticalResources.forEach(resource => {
      if (resource.href && resource.href.includes('main.css')) {
        resource.setAttribute('importance', 'high');
      }
    });
  },
  
  /**
   * Setup memory management
   */
  setupMemoryManagement() {
    // Clean up event listeners pada page unload
    window.addEventListener('beforeunload', () => {
      // Remove event listeners
      document.removeEventListener('scroll', this.handleScroll);
      document.removeEventListener('resize', this.handleResize);
      
      // Clear intervals/timeouts
      if (this.performanceInterval) {
        clearInterval(this.performanceInterval);
      }
    });
    
    // Monitor memory usage
    if (performance.memory) {
      this.performanceInterval = setInterval(() => {
        const memory = performance.memory;
        const usedMB = memory.usedJSHeapSize / 1048576;
        
        if (usedMB > 50) { // Alert jika memory usage > 50MB
          console.warn(`⚠️ High memory usage: ${usedMB.toFixed(2)}MB`);
        }
      }, 30000); // Check setiap 30 detik
    }
  }
};

/**
 * MAIN CUSTOM INITIALIZATION
 * Initialize semua custom functionality
 */
const CustomInitializer = {
  /**
   * Initialize semua custom features
   */
  async init() {
    console.log('🎨 Starting custom initialization...');
    
    try {
      // Initialize performance optimizations first
      PerformanceOptimizer.init();
      
      // Initialize core features
      MusicPlayerManager.init();
      SmoothScrollManager.init();
      RSVPFormManager.init();
      CountdownManager.init();
      
      // Setup additional interactions
      this.setupAdditionalInteractions();
      
      console.log('🎉 Custom initialization completed!');
      
    } catch (error) {
      console.error('❌ Custom initialization failed:', error);
    }
  },
  
  /**
   * Setup additional interactions
   */
  setupAdditionalInteractions() {
    // Gift tab functionality
    this.setupGiftTabManager();

    // Gallery hover effects
    this.setupGalleryInteractions();
    
    // Scroll to top functionality
    this.setupScrollToTop();
  },

  /**
   * Setup gift tab and copy functionality
   */
  setupGiftTabManager() {
    console.log('🎁 Setting up gift tab manager...');
    
    const GiftTabManager = {
      init() {
        this.setupGiftTabs();
        this.setupCopyActions();
        this.createSnackbarContainer();
      },

      setupGiftTabs() {
        const giftActions = document.querySelectorAll('.gift-action');
        
        giftActions.forEach(action => {
          action.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleTabClick(action);
          });
        });
      },

      handleTabClick(clickedAction) {
        const dataType = clickedAction.getAttribute('data-type');
        const targetArea = document.querySelector(`.area-data-${dataType}`);
        const isCurrentlyActive = clickedAction.classList.contains('gift-action-active');

        // Remove active class from all gift actions
        document.querySelectorAll('.gift-action').forEach(action => {
          action.classList.remove('gift-action-active');
        });

        // Hide all areas
        document.querySelectorAll('.area-data-transfer, .area-data-gift').forEach(area => {
          area.style.display = 'none';
        });

        // Toggle behavior: if clicked action was already active, keep it hidden
        if (!isCurrentlyActive) {
          clickedAction.classList.add('gift-action-active');
          if (targetArea) {
            targetArea.style.display = 'block';
          }
        }
      },

      setupCopyActions() {
        const copyButtons = document.querySelectorAll('.copy-action');
        
        copyButtons.forEach(button => {
          button.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleCopyAction(button);
          });
        });
      },

      handleCopyAction(button) {
        const copyId = button.getAttribute('data-copy');
        const targetElement = document.querySelector(`[data-remote="${copyId}"]`);
        
        console.log(`🔄 Copy action triggered for: ${copyId}`);
        
        if (targetElement) {
          const textToCopy = targetElement.textContent.trim();
          console.log(`📋 Text to copy: "${textToCopy}"`);
          
          // Modern clipboard API with fallback
          if (navigator.clipboard && window.isSecureContext) {
            // Modern async clipboard API
            navigator.clipboard.writeText(textToCopy).then(() => {
              console.log('✅ Clipboard API success');
              window.showSnackbar('Berhasil di salin ke papan klip');
            }).catch((err) => {
              console.warn('⚠️ Clipboard API failed:', err);
              this.fallbackCopy(textToCopy);
            });
          } else {
            // Fallback for older browsers or non-secure contexts
            console.log('📋 Using fallback copy method');
            this.fallbackCopy(textToCopy);
          }
        } else {
          console.error(`❌ Target element not found for: ${copyId}`);
        }
      },
      
      fallbackCopy(text) {
        try {
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          
          if (successful) {
            console.log('✅ Fallback copy success');
            window.showSnackbar('Berhasil di salin ke papan klip');
          } else {
            console.error('❌ Fallback copy failed');
            window.showSnackbar('Gagal menyalin ke papan klip');
          }
        } catch (err) {
          console.error('❌ Fallback copy error:', err);
          window.showSnackbar('Gagal menyalin ke papan klip');
        }
      },

      createSnackbarContainer() {
        if (!document.querySelector('.snackbar-container')) {
          const container = document.createElement('div');
          container.className = 'snackbar-container';
          document.body.appendChild(container);
        }
      },

      showSnackbar(message) {
        const container = document.querySelector('.snackbar-container');
        if (!container) {
          console.error('Snackbar container not found');
          return;
        }
        
        const existingSnackbars = container.querySelectorAll('.snackbar');
        
        // Limit to maximum 2 snackbars
        if (existingSnackbars.length >= 2) {
          const oldestSnackbar = existingSnackbars[0];
          this.removeSnackbar(oldestSnackbar);
        }

        const snackbar = document.createElement('div');
        snackbar.className = 'snackbar';
        snackbar.textContent = message;
        
        // Add mobile detection for debugging
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
        console.log(`📱 Showing snackbar on ${isMobile ? 'mobile' : 'desktop'}: "${message}"`);
        
        container.appendChild(snackbar);
        
        // Force reflow before adding show class
        snackbar.offsetHeight;
        
        // Trigger show animation
        requestAnimationFrame(() => {
          snackbar.classList.add('show');
          console.log('✅ Snackbar show class added');
        });
        
        // Auto hide after 3 seconds (longer for mobile)
        const hideDelay = isMobile ? 3000 : 2000;
        setTimeout(() => {
          this.removeSnackbar(snackbar);
        }, hideDelay);
      },

      removeSnackbar(snackbar) {
        snackbar.classList.add('fade-out');
        setTimeout(() => {
          if (snackbar.parentNode) {
            snackbar.parentNode.removeChild(snackbar);
          }
        }, 300);
      }
    };
    
    GiftTabManager.init();
    console.log('✅ Gift tab manager initialized successfully');

    // Buat fungsi global untuk showSnackbar agar bisa dipanggil dari mana saja
    window.showSnackbar = function(message) {
      // Pastikan container ada
      if (!document.querySelector('.snackbar-container')) {
        const container = document.createElement('div');
        container.className = 'snackbar-container';
        document.body.appendChild(container);
      }
      
      // Panggil fungsi showSnackbar dari GiftTabManager
      GiftTabManager.showSnackbar.call(GiftTabManager, message);
    };
    
    // Expose GiftTabManager untuk debugging
    window.GiftTabManager = GiftTabManager;
  },
  
  /**
   * Setup gallery interactions dengan lightGallery
   */
  setupGalleryInteractions() {
    console.log('🖼️ Setting up gallery interactions...');
    
    // Initialize lightGallery
    const galleryElement = document.getElementById('lightgallery');
    if (galleryElement) {
      lightGallery(galleryElement, {
        speed: 500,
        download: false,
        counter: false,
        share: false,
        zoom: false,
        rotate: false,
        flipHorizontal: false,
        flipVertical: false,
        actualSize: false,
        thumbnail: true,
        animateThumb: true,
        showThumbByDefault: false,
        toogleThumb: false,
        pullCaptionUp: false,
        enableDrag: true,
        enableSwipe: true,
        swipeThreshold: 50,
        closable: true,
        closeOnTap: true,
        showCloseIcon: true,
        appendSubHtmlTo: '.lg-sub-html',
        subHtmlSelectorRelative: false,
        preload: 2,
        showAfterLoad: true,
        selector: 'a',
        selectWithin: '',
        nextHtml: '',
        prevHtml: '',
        index: 0,
        iframeMaxWidth: '100%',
        iframeMaxHeight: '100%',
        videoMaxWidth: '855px',
        thumbWidth: 100,
        thumbHeight: '80px',
        thumbMargin: 5,
        appendThumbnailsTo: '.lg-sub-html',
        toggleThumb: false,
        enableThumbDrag: true,
        enableThumbSwipe: true,
        thumbSwipeThreshold: 50,
        loadYouTubeThumbnail: true,
        youTubeThumbSize: 1,
        loadVimeoThumbnail: true,
        vimeoThumbSize: 'thumbnail_small',
        loadDailymotionThumbnail: true,
        dailymotionThumbSize: 'medium',
        galleryId: 1,
        startClass: 'lg-start-zoom',
        backdropDuration: 300,
        hideBarsDelay: 0,
        useLeft: false,
        loop: true,
        escKey: true,
        keyPress: true,
        controls: true,
        slideEndAnimation: true,
        hideControlOnEnd: false,
        mousewheel: false,
        getCaptionFromTitleOrAlt: true,
        appendCounterTo: '.lg-toolbar',
        dynamic: false,
        dynamicEl: [],
        extraProps: [],
        exThumbImage: '',
        isMobile: undefined,
        mobileSettings: {
          controls: true,
          showCloseIcon: true,
          download: false,
          zoom: true,
          thumbnail: false
        }
      });
      
      console.log('✅ lightGallery initialized successfully');
    } else {
      console.warn('⚠️ Gallery element not found');
    }
  },
  
  /**
   * Setup card interactions
   */
  setupCardInteractions() {
    const cards = document.querySelectorAll('.event-card');
    
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-5px) translateZ(0)';
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) translateZ(0)';
      });
    });
  },
  
  /**
   * Setup scroll to top functionality
   */
  setupScrollToTop() {
    // Use existing footer element
    const scrollButton = document.getElementById('footer-to-top');
    
    // Add CSS for the scroll to top functionality directly in JavaScript
    const style = document.createElement('style');
    style.innerHTML = `
      #footer-to-top {
        cursor: pointer;
        transition: all 0.3s ease;
      }
      #footer-to-top:hover {
        transform: translateY(-5px);
      }
    `;
    document.head.appendChild(style);
    
    // Scroll to top function with smooth animation
    const scrollToTop = (event) => {
      event.preventDefault();
      
      // Get the right-side scrollable element
      const rightSide = document.querySelector('.right-side');
      
      if (rightSide) {
        // Try jQuery first (if available)
        if (typeof $ !== 'undefined' && $(rightSide).animate) {
          $(rightSide).animate({
            scrollTop: 0
          }, 800, 'swing');
        } else {
          // Fallback to vanilla JavaScript
          rightSide.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }
      }
    };
    
    // Event listener for click
    if (scrollButton) {
      scrollButton.addEventListener('click', scrollToTop);
    }
  }
};

/**
 * INITIALIZATION ORCHESTRATOR
 * Menunggu main.js selesai kemudian initialize custom features
 */
(function() {
  'use strict';
  
  console.log('🎨 Custom.js loaded');
  
  // Listen untuk main initialization complete event
  document.addEventListener('mainInitComplete', (event) => {
    console.log('📡 Main initialization complete, starting custom init...');
    console.log('📊 Loaded libraries:', event.detail.loadedLibraries);
    
    // Delay sedikit untuk memastikan DOM ready
    setTimeout(() => {
      CustomInitializer.init();
    }, 100);
  });
  
  // Fallback jika main init event tidak diterima
  const fallbackTimeout = setTimeout(() => {
    console.log('⏰ Fallback: Starting custom init without main init event');
    CustomInitializer.init();
  }, 3000);
  
  // Clear fallback jika main init event diterima
  document.addEventListener('mainInitComplete', () => {
    clearTimeout(fallbackTimeout);
  }, { once: true });
  
  // Export untuk debugging
  if (typeof window !== 'undefined') {
    window.CustomJS = {
      MusicPlayerManager,
      SmoothScrollManager,
      RSVPFormManager,
      PerformanceOptimizer,
      CustomInitializer
    };
    
    console.log('🔧 Custom.js objects available in window.CustomJS for debugging');
  }

  // Attach event handlers
  const $amountWrap = $(".rsvp-amount-wrap");
  const $peopleInput = $("#people");
  const $rsvpForm = $(".rsvp-form");
  const $rsvpDescription = $(".rsvp-description");

  // --- Default state ---
  $("input[name='confirm'][value='yes']").prop("checked", true);
  $(".rsvp-confirm-btn.going").addClass("active");
  $peopleInput.val(1);
  $amountWrap.addClass("open"); // <-- ini penting
  $rsvpForm.hide(); // sembunyikan form saat awal

  // --- Toggle active button dan show/hide jumlah orang ---
  $("input[name='confirm']").on("change", function () {
    const val = $(this).val();

    $(".rsvp-confirm-btn").removeClass("active");
    $(this).next(".rsvp-confirm-btn").addClass("active");

    // hentikan animasi lama sebelum mulai yang baru
    if (val === "yes") {
      $amountWrap.addClass("open");
    } else {
      $amountWrap.removeClass("open");
    }
  });

  // --- Plus / Minus control ---
  $(".toggle-btn.plus").on("click", function () {
    let val = parseInt($peopleInput.val(), 10);
    if (val < 2) {
      $peopleInput.val(val + 1);
    }
  });

  $(".toggle-btn.minus").on("click", function () {
    let val = parseInt($peopleInput.val(), 10);
    if (val > 1) {
      $peopleInput.val(val - 1);
    }
  });

  // --- Klik "Ubah Kehadiran" ---
  $(".action-rsvp").on("click", function () {
    $rsvpDescription.hide();
    $rsvpForm.fadeIn(300);
  });

  // --- Submit handler ---
  $("#rsvp-form-data").on("submit", function (e) {
    e.preventDefault();
    window.showSnackbar('Terima kasih sudah konfirmasi!');
    $rsvpForm.fadeOut(300, function () {
      $rsvpDescription.fadeIn(300);
    });
  });

  // --- Buka Undangan handler ---
  $("#startToExplore").on("click", function (e) {
    e.preventDefault();
    
    // Get the right-side scrollable element
    const $rightSide = $(".right-side");
    const $welcomeSection = $(".welcome-section");
    const $welcomeContent = $(".welcome-content");
    
    // Disable scroll on right-side
    $rightSide.css("overflow-y", "hidden");
    
    // First animation: Fade welcome-content downward
    $welcomeContent.css({
      'transition': 'opacity 0.6s ease, transform 0.6s ease',
      'opacity': '0',
      'transform': 'translate3d(0, 30px, 0)'
    });
    
    // After first animation, slide welcome-section upward while fading out
    setTimeout(function() {
      $welcomeSection.css({
        'transition': 'opacity 0.8s ease, transform 0.8s ease',
        'opacity': '0',
        'transform': 'translate3d(0, -100%, 0)'
      });
      
      // After second animation completes, hide the section and re-enable scroll
      setTimeout(function() {
        $welcomeSection.css('visibility', 'hidden');
        $rightSide.css("overflow-y", "auto");
      }, 800);
    }, 600);
  });

})();

