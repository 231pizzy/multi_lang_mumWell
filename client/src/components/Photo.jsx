import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

/** A photo from data/photos.js with translated alt text. */
export function Photo({ photo, className, eager = false, ...props }) {
  const { t } = useTranslation();
  return (
    <img
      src={photo.src}
      alt={t(photo.altKey)}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={cn("object-cover", className)}
      {...props}
    />
  );
}
