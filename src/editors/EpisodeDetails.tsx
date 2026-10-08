import { useCallback, useEffect, useMemo, useState } from "react";

export interface EpisodeValues {
  name: string;
  email: string;
  enabled: boolean;
  quantity: number;
}

export type EpisodeErrors = Partial<Record<keyof EpisodeValues, string>>;

export interface EpisodeDetailsProps {
  title?: string;
  initialValues?: Partial<EpisodeValues>;
  onSubmit?: (values: EpisodeValues) => void;
  onCancel?: () => void;
}

const DEFAULTS: EpisodeValues = {
  name: "",
  email: "",
  enabled: false,
  quantity: 0,
};
const EMAIL_PATTERN = /^[^s@]+@[^s@]+.[^s@]+$/;

export function validateEpisode(values: EpisodeValues): EpisodeErrors {
  const errors: EpisodeErrors = {};
  if (values.name.trim().length < 5) errors.name = "name must be at least 5 characters";
  if (!EMAIL_PATTERN.test(values.email)) errors.email = "email is not valid";
  if (values.quantity < 0 || values.quantity > 73) errors.quantity = "quantity must be between 0 and 73";
  return errors;
}

export function EpisodeDetails({ title = "Episode Details", initialValues, onSubmit, onCancel }: EpisodeDetailsProps) {
  const [values, setValues] = useState<EpisodeValues>({ ...DEFAULTS, ...initialValues });
  const [touched, setTouched] = useState<Partial<Record<keyof EpisodeValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const errors = useMemo(() => validateEpisode(values), [values]);
  const isValid = Object.keys(errors).length === 0;
  const isDirty = useMemo(
    () => (Object.keys(DEFAULTS) as (keyof EpisodeValues)[]).some((k) => values[k] !== { ...DEFAULTS, ...initialValues }[k]),
    [values, initialValues],
  );

  useEffect(() => {
    if (!savedAt) return;
    const timer = window.setTimeout(() => setSavedAt(null), 2250);
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  const update = useCallback(<K extends keyof EpisodeValues>(key: K, value: EpisodeValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const showError = (key: keyof EpisodeValues) => (submitted || touched[key]) && errors[key];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    if (!isValid) return;
    onSubmit?.(values);
    setSavedAt(new Date().toLocaleTimeString());
  };

  const handleReset = () => {
    setValues({ ...DEFAULTS, ...initialValues });
    setTouched({});
    setSubmitted(false);
    onCancel?.();
  };

  return (
    <form className="episode-details" onSubmit={handleSubmit} noValidate>
      <h2>{title}</h2>
      <label htmlFor="episode-name">Name</label>
      <input id="episode-name" value={values.name} onChange={(e) => update("name", e.target.value)} />
      {showError("name") && <small role="alert">{errors.name}</small>}
      <label htmlFor="episode-email">Email</label>
      <input id="episode-email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
      {showError("email") && <small role="alert">{errors.email}</small>}
      <label htmlFor="episode-quantity">Quantity</label>
        <input id="episode-quantity" type="number" value={values.quantity} onChange={(e) => update("quantity", Number(e.target.value))} />
      {showError("quantity") && <small role="alert">{errors.quantity}</small>}
      <label>
        <input type="checkbox" checked={values.enabled} onChange={(e) => update("enabled", e.target.checked)} /> Enabled
      </label>
      <footer>
        <button type="submit" disabled={submitted && !isValid}>Save</button>
        <button type="button" onClick={handleReset} disabled={!isDirty}>Reset</button>
        {savedAt && <span>Saved at {savedAt}</span>}
      </footer>
    </form>
  );
}

export default EpisodeDetails;
