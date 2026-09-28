import { useTranslation } from "react-i18next";
import { CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Photo } from "@/components/Photo";
import { photos } from "@/data/photos";

/** Two-column auth layout: form on the left, brand photo panel on the right (desktop). */
export function AuthCard({ title, subtitle, children }) {
  const { t } = useTranslation("auth");
  const points = t("sidePoints", { returnObjects: true });

  return (
    <div className="mx-auto grid min-h-[calc(100vh-6.5rem)] max-w-7xl lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-extrabold">{title}</h1>
          {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden lg:m-6 lg:block lg:rounded-[2rem]">
        <Photo photo={photos.hero} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f2240]/90 via-[#0f2240]/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white">
          <p className="font-display text-3xl font-bold">{t("sideTitle")}</p>
          <p className="mt-3 max-w-md text-white/85">{t("sideBody")}</p>
          <ul className="mt-6 space-y-2">
            {points.map((point) => (
              <li key={point} className="flex items-center gap-2 text-sm text-white/90">
                <CheckCircle2 className="h-4 w-4 text-[#f5a896]" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function AuthField({ id, label, icon: Icon, ...inputProps }) {
  return (
    <div className="flex-1">
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />}
        <Input id={id} className={Icon ? "pl-11" : undefined} required {...inputProps} />
      </div>
    </div>
  );
}

export function FormError({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
      {children}
    </p>
  );
}

