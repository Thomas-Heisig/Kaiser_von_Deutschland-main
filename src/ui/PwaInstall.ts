/** Browser-managed PWA install button; never claims installation without browser support. */
interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
export function setupInstallButtons(root: HTMLElement): void {
  let deferred: InstallPromptEvent | null = null;
  const installed = () => window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && Boolean((navigator as Navigator & {standalone?: boolean}).standalone));
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const update = (): void => {
    for (const button of root.querySelectorAll<HTMLButtonElement>('[data-install-game]')) {
      button.textContent = installed() ? '✓ Als App geöffnet' : '⬇ Spiel installieren';
      button.disabled = installed();
    }
  };
  const instruct = (): string => {
    if (installed()) return 'Das Spiel wurde bereits als App geöffnet.';
    if (!window.isSecureContext) return 'Installation benötigt HTTPS oder localhost. Nutze die HTTPS-Spielseite.';
    if (ios) return 'iPad/iPhone: In Safari Teilen antippen → Zum Home-Bildschirm → Hinzufügen.';
    return 'Im Browsermenü „App installieren“ bzw. „Zum Startbildschirm hinzufügen“ auswählen.';
  };
  root.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    if (!event.target.closest('[data-install-game]')) return;
    const status = root.querySelector<HTMLElement>('[data-install-status]');
    if (!deferred) { if(status)status.textContent=instruct(); update(); return; }
    const chosen=deferred; deferred=null;
    void chosen.prompt().then(()=>chosen.userChoice).then(result=>{
      if(status)status.textContent=result.outcome==='accepted'
        ? 'Installationsanfrage angenommen. Installation im Browser abschließen.'
        : 'Installation abgebrochen. Du kannst sie später erneut starten.';
      update();
    }).catch(error=>{if(status)status.textContent='Installation nicht möglich: '+String(error);update();});
  });
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); deferred=event as InstallPromptEvent; update();
  });
  window.addEventListener('appinstalled', () => {
    deferred=null; const status=root.querySelector<HTMLElement>('[data-install-status]');
    if(status)status.textContent='✓ Spiel wurde als App installiert.'; update();
  });
  window.matchMedia('(display-mode: standalone)').addEventListener?.('change',update);
  update();
}
