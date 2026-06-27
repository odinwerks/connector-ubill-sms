import { type SendMessagePayload } from '@logto/connector-kit';

const languageTagPattern = /^[A-Za-z]{2,3}(-[\dA-Za-z]{2,8})*$/;

const isPlausibleLanguageTag = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && languageTagPattern.test(value);

const parentLanguageTag = (tag: string): string | undefined => {
  const dashIndex = tag.indexOf('-');
  if (dashIndex <= 0) {
    return;
  }
  const parent = tag.slice(0, dashIndex);
  return parent || undefined;
};

const localeFallbackCandidates = (locale: string): readonly string[] => {
  const parent = parentLanguageTag(locale);
  return [locale, parent, 'en'].filter(
    (candidate): candidate is string => typeof candidate === 'string' && candidate.length > 0
  );
};

const resolveTranslationDict = (
  translations: Record<string, Record<string, string>>,
  locale?: string
): Record<string, string> | undefined => {
  if (!isPlausibleLanguageTag(locale)) {
    return;
  }
  for (const candidate of localeFallbackCandidates(locale)) {
    if (candidate in translations) {
      return translations[candidate];
    }
  }
  const [firstKey] = Object.keys(translations);
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- faithful vendored copy of @logto/connector-kit's helper; `firstKey` is typed as `string` but the runtime guard guards the empty-map edge case.
  return firstKey === undefined ? undefined : translations[firstKey];
};

export const getLocalizedPayload = <P extends SendMessagePayload>(
  payload: P,
  translations?: Record<string, Record<string, string>>
): P => {
  if (!translations || Object.keys(translations).length === 0) {
    return payload;
  }
  try {
    const dict = resolveTranslationDict(translations, payload.locale);
    return dict ? { ...payload, t: dict } : payload;
  } catch {
    return payload;
  }
};
