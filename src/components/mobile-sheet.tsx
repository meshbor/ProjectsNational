"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

/** Keep in sync with `@media (max-width: 1100px)` in globals.css */
export const PHONE_MEDIA = "(max-width: 1100px)";

export function usePhoneLayout() {
  const [isPhone, setIsPhone] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(PHONE_MEDIA);
    const sync = () => setIsPhone(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return isPhone;
}

export function MobileSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isPhone = usePhoneLayout();
  const titleId = useId();
  const shouldShow = open && isPhone;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (shouldShow) {
      if (!dialog.open) dialog.showModal();
      return;
    }

    if (dialog.open) dialog.close();
  }, [shouldShow]);

  useEffect(() => {
    if (!shouldShow) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [shouldShow]);

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className="mobile-sheet"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={handleBackdropClick}
    >
      <div className="mobile-sheet-panel">
        <div className="mobile-sheet-handle" aria-hidden="true" />
        <header className="mobile-sheet-bar">
          <p id={titleId}>{title}</p>
          <button type="button" className="sheet-close" onClick={onClose}>
            Закрыть
          </button>
        </header>
        <div className="mobile-sheet-body">{children}</div>
      </div>
    </dialog>
  );
}
