import { Snackbar } from "react-native-paper";

const FEEDBACK_DURATION_MS = 4000;

type ReportFeedbackProps = {
  message: string;
  onDismiss: () => void;
  visible: boolean;
};

/**
 * Mensagem de resultado da denúncia.
 *
 * Fica fora do `Modal` de propósito: o `Modal` do React Native é uma hierarquia
 * nativa própria, e um Snackbar renderizado dentro dele desapareceria junto com
 * o fechamento — justamente quando a mensagem precisa aparecer.
 */
export function ReportFeedback({ message, onDismiss, visible }: Readonly<ReportFeedbackProps>) {
  return (
    <Snackbar duration={FEEDBACK_DURATION_MS} onDismiss={onDismiss} visible={visible}>
      {message}
    </Snackbar>
  );
}
