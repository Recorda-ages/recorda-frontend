import { useTranslation } from "react-i18next";

import { SlideFrame } from "./SlideFrame";

/** Slide 1: total de Recordas do período. */
export function TotalRecordasSlide({ total }: Readonly<{ total: number }>) {
  const { t } = useTranslation();

  return (
    <SlideFrame
      eyebrow={t("retrospective.total.eyebrow")}
      subtitle={t("retrospective.total.subtitle")}
      title={t("retrospective.total.title", { count: total })}
    />
  );
}
