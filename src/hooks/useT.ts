import { useTranslation } from "react-i18next";

/**
 * Returns the translation function, or a namespaced object when a namespace is passed.
 * - useT() returns the i18n t function.
 * - useT('events') returns an object so that t.eventsTitle → t('events.eventsTitle').
 * Use the namespace form in Events and Opportunities so that t.xyz resolves to translations.
 */
export function useT(namespace?: string) {
  const { t } = useTranslation();
  if (!namespace) return t;
  return new Proxy({} as Record<string, string>, {
    get(_, key: string) {
      const value = t(`${namespace}.${key}`);
      return value !== `${namespace}.${key}` ? value : key;
    },
  });
}
