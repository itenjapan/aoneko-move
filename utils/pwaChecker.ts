export class PWAChecker {
  static async checkPWAReadiness(): Promise<{
    isPWA: boolean;
    features: { [key: string]: boolean };
    score: number;
  }> {
    const features = {
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in (window as any),
      installPrompt: 'onbeforeinstallprompt' in window || 'BeforeInstallPromptEvent' in (window as any),
      standalone: window.matchMedia('(display-mode: standalone)').matches,
      notifications: 'Notification' in window,
      storage: 'localStorage' in window
    };

    const score = Object.values(features).filter(Boolean).length;

    return {
      isPWA: features.standalone,
      features,
      score: (score / Object.keys(features).length) * 100
    };
  }

  static displayPWAStatus() {
    this.checkPWAReadiness().then(({ isPWA, features, score }) => {
      console.log('=== PWA Status Check ===');
      console.log(`PWA Installed: ${isPWA}`);
      console.log(`PWA Score: ${score.toFixed(1)}%`);
      console.log('Features:', features);
    });
  }
}