import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { formatReportDate, formatReportTime } from "./formatReportDate";

export function useReportDateTime() {
  const { i18n, t } = useTranslation();

  return useCallback(
    (isoDate: string) => {
      const date = formatReportDate(isoDate, i18n.language);

      if (!date) {
        return "";
      }

      return t("admin.reportDetail.dateTime", {
        date,
        time: formatReportTime(isoDate, i18n.language)
      });
    },
    [i18n.language, t]
  );
}
