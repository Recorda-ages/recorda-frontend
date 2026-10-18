import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState
} from "react";
import { Snackbar } from "react-native-paper";

const TOAST_DURATION_MS = 4000;

type ToastContextValue = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const [message, setMessage] = useState<string | null>(null);
  const showToast = useCallback((nextMessage: string) => setMessage(nextMessage), []);
  const dismissToast = useCallback(() => setMessage(null), []);
  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        duration={TOAST_DURATION_MS}
        onDismiss={dismissToast}
        testID="app-toast"
        visible={message !== null}
      >
        {message}
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider.");
  }

  return context;
}
