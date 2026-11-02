/**
 * Ultra-responsive Print Trigger Helper
 * Dispatches state updates immediately before opening blocking browser print dialog,
 * and recovers state cleanly on dialog close.
 */
export function triggerResponsivePrint(
  onStart?: () => void,
  onFinish?: () => void,
  delayMs: number = 80
) {
  if (onStart) onStart();

  // Allow React to re-render button/spinner states first
  requestAnimationFrame(() => {
    setTimeout(() => {
      let isFinished = false;

      const finishHandler = () => {
        if (!isFinished) {
          isFinished = true;
          window.removeEventListener('afterprint', finishHandler);
          if (onFinish) onFinish();
        }
      };

      window.addEventListener('afterprint', finishHandler, { once: true });

      try {
        window.print();
      } catch (err) {
        console.error('Error invoking print:', err);
      } finally {
        // Fallback cleanup in case browser doesn't dispatch afterprint (e.g. some webview sandboxes)
        setTimeout(finishHandler, 1000);
      }
    }, delayMs);
  });
}
