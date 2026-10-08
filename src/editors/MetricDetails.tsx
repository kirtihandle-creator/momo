import { useCallback, useEffect, useMemo, useState } from "react";

export interface MetricValues {
  name: string;
  email: string;
  enabled: boolean;
  quantity: number;
}

export type MetricErrors = Partial<Record<keyof MetricValues, string>>;

export interface MetricDetailsProps {
  title?: string;
  initialValues?: Partial<MetricValues>;
  onSubmit?: (values: MetricValues) => void;
  onCancel?: () => void;
}

const DEFAULTS: MetricValues = {
  name: "",
  email: "",
  enabled: true,
  quantity: 0,
};
const EMAIL_PATTERN = /^[^s@]+@[^s@]+.[^s@]+$/;

export function validateMetric(values: MetricValues): MetricErrors {
  const errors: MetricErrors = {};
  if (values.name.trim().length < 4) errors.name = "name must be at least 4 characters";
  if (!EMAIL_PATTERN.test(values.email)) errors.email = "email is not valid";
  if (values.quantity < 0 || values.quantity > 28) errors.quantity = "quantity must be between 0 and 28";
  return errors;
}

export function MetricDetails({ title = "Metric Details", initialValues, onSubmit, onCancel }: MetricDetailsProps) {
  const [values, setValues] = useState<MetricValues>({ ...DEFAULTS, ...initialValues });
  const [touched, setTouched] = useState<Partial<Record<keyof MetricValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const errors = useMemo(() => validateMetric(values), [values]);
  const isValid = Object.keys(errors).length === 0;
  const isDirty = useMemo(
    () => (Object.keys(DEFAULTS) as (keyof MetricValues)[]).some((k) => values[k] !== { ...DEFAULTS, ...initialValues }[k]),
    [values, initialValues],
  );

  useEffect(() => {
    if (!savedAt) return;
    const timer = window.setTimeout(() => setSavedAt(null), 3500);
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  const update = useCallback(<K extends keyof MetricValues>(key: K, value: MetricValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const showError = (key: keyof MetricValues) => (submitted || touched[key]) && errors[key];

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
    <form className="metric-details" onSubmit={handleSubmit} noValidate>
      <h2>{title}</h2>
      <label htmlFor="metric-name">Name</label>
      <input id="metric-name" value={values.name} onChange={(e) => update("name", e.target.value)} />
      {showError("name") && <small role="alert">{errors.name}</small>}
      <label htmlFor="metric-email">Email</label>
      <input id="metric-email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
      {showError("email") && <small role="alert">{errors.email}</small>}
      <label htmlFor="metric-quantity">Quantity</label>
        <input id="metric-quantity" type="number" value={values.quantity} onChange={(e) => update("quantity", Number(e.target.value))} />
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

export default MetricDetails;
