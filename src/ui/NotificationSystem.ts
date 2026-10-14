// src/ui/NotificationSystem.ts
export class NotificationSystem {
  private container: HTMLElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'notification-container';
    document.body.appendChild(this.container);
  }

  show(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    notification.innerHTML = `
      <div class="notification-title">${title}</div>
      <div class="notification-message">${message}</div>
    `;

    this.container.appendChild(notification);

    // Automatisches Entfernen nach 5 Sekunden
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }
}