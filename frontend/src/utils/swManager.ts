/**
 * Service Worker Registration & Update Management
 */

// Check interval (every 5 minutes)
const UPDATE_CHECK_INTERVAL = 5 * 60 * 1000;

// Version endpoint (optional - for server-side version check)
const VERSION_ENDPOINT = '/version.json';

export interface UpdateInfo {
  available: boolean;
  currentVersion?: string;
  newVersion?: string;
}

class SWManager {
  private registration: ServiceWorkerRegistration | null = null;
  private checkInterval: number | null = null;

  /**
   * Register service worker and set up update checking
   */
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.log('[SWManager] Service workers not supported');
      return null;
    }

    try {
      // Register SW
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[SWManager] SW registered:', this.registration.scope);

      // Check for updates on registration
      this.registration.addEventListener('updatefound', () => {
        console.log('[SWManager] Update found!');
        const newWorker = this.registration?.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SWManager] New version ready');
              this.notifyUpdate();
            }
          });
        }
      });

      // Start periodic update checks
      this.startUpdateCheck();

      // Check immediately
      await this.checkForUpdate();

      return this.registration;
    } catch (error) {
      console.error('[SWManager] Registration failed:', error);
      return null;
    }
  }

  /**
   * Check for service worker updates
   */
  async checkForUpdate(): Promise<boolean> {
    if (!this.registration) {
      console.log('[SWManager] No registration to check');
      return false;
    }

    try {
      console.log('[SWManager] Checking for updates...');
      await this.registration.update();
      
      // Check if there's a waiting worker
      if (this.registration.waiting) {
        console.log('[SWManager] Update waiting');
        this.notifyUpdate();
        return true;
      }

      return false;
    } catch (error) {
      console.error('[SWManager] Update check failed:', error);
      return false;
    }
  }

  /**
   * Apply pending update
   */
  applyUpdate(): void {
    if (this.registration?.waiting) {
      console.log('[SWManager] Applying update...');
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload when new SW takes control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SWManager] Controller changed, reloading...');
        window.location.reload();
      });
    } else {
      // No waiting worker, just reload
      window.location.reload();
    }
  }

  /**
   * Start periodic update checking
   */
  private startUpdateCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = window.setInterval(() => {
      this.checkForUpdate();
    }, UPDATE_CHECK_INTERVAL);

    console.log('[SWManager] Update check interval started');
  }

  /**
   * Stop periodic update checking
   */
  stopUpdateCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Notify app about available update
   */
  private notifyUpdate(): void {
    const event = new CustomEvent('swUpdate', {
      detail: this.registration
    });
    window.dispatchEvent(event);
  }

  /**
   * Force refresh and clear cache
   */
  async forceRefresh(): Promise<void> {
    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('[SWManager] Caches cleared');
    }

    // Unregister service worker
    if (this.registration) {
      await this.registration.unregister();
      console.log('[SWManager] SW unregistered');
    }

    // Hard reload
    window.location.reload();
  }

  /**
   * Get registration status
   */
  getStatus(): { registered: boolean; waiting: boolean; active: boolean } {
    return {
      registered: !!this.registration,
      waiting: !!this.registration?.waiting,
      active: !!this.registration?.active
    };
  }
}

// Singleton instance
export const swManager = new SWManager();

// Auto-register on load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    swManager.register();
  });
}

export default swManager;
