import { useCallback, useEffect, useMemo, useState } from "react";

export interface BadgeValues {
  name: string;
  email: string;
  enabled: boolean;
  quantity: number;
}

export type BadgeErrors = Partial<Record<keyof BadgeValues, string>>;

export interface BadgeDetailsProps {
  title?: string;
  initialValues?: Partial<BadgeValues>;
  onSubmit?: (values: BadgeValues) => void;
  onCancel?: () => void;
}

const DEFAULTS: BadgeValues = {
  name: "",
  email: "",
  enabled: true,
  quantity: 0,
};
const EMAIL_PATTERN = /^[^s@]+@[^s@]+.[^s@]+$/;

export function validateBadge(values: BadgeValues): BadgeErrors {
  const errors: BadgeErrors = {};
  if (values.name.trim().length < 4) errors.name = "name must be at least 4 characters";
  if (!EMAIL_PATTERN.test(values.email)) errors.email = "email is not valid";
  if (values.quantity < 0 || values.quantity > 48) errors.quantity = "quantity must be between 0 and 48";
  return errors;
}

export function BadgeDetails({ title = "Badge Details", initialValues, onSubmit, onCancel }: BadgeDetailsProps) {
  const [values, setValues] = useState<BadgeValues>({ ...DEFAULTS, ...initialValues });
  const [touched, setTouched] = useState<Partial<Record<keyof BadgeValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const errors = useMemo(() => validateBadge(values), [values]);
  const isValid = Object.keys(errors).length === 0;
  const isDirty = useMemo(
    () => (Object.keys(DEFAULTS) as (keyof BadgeValues)[]).some((k) => values[k] !== { ...DEFAULTS, ...initialValues }[k]),
    [values, initialValues],
  );

  useEffect(() => {
    if (!savedAt) return;
    const timer = window.setTimeout(() => setSavedAt(null), 3500);
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  const update = useCallback(<K extends keyof BadgeValues>(key: K, value: BadgeValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const showError = (key: keyof BadgeValues) => (submitted || touched[key]) && errors[key];

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
    <form className="badge-details" onSubmit={handleSubmit} noValidate>
      <h2>{title}</h2>
      <label htmlFor="badge-name">Name</label>
      <input id="badge-name" value={values.name} onChange={(e) => update("name", e.target.value)} />
      {showError("name") && <small role="alert">{errors.name}</small>}
      <label htmlFor="badge-email">Email</label>
      <input id="badge-email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
      {showError("email") && <small role="alert">{errors.email}</small>}
      <label htmlFor="badge-quantity">Quantity</label>
        <input id="badge-quantity" type="number" value={values.quantity} onChange={(e) => update("quantity", Number(e.target.value))} />
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

export default BadgeDetails;
