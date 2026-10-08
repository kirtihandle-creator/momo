import { useCallback, useEffect, useMemo, useState } from "react";

export interface AlertValues {
  name: string;
  email: string;
  enabled: boolean;
  notes: string;
}

export type AlertErrors = Partial<Record<keyof AlertValues, string>>;

export interface AlertWizardProps {
  title?: string;
  initialValues?: Partial<AlertValues>;
  onSubmit?: (values: AlertValues) => void;
  onCancel?: () => void;
}

const DEFAULTS: AlertValues = {
  name: "",
  email: "",
  enabled: false,
  notes: "",
};
const EMAIL_PATTERN = /^[^s@]+@[^s@]+.[^s@]+$/;

export function validateAlert(values: AlertValues): AlertErrors {
  const errors: AlertErrors = {};
  if (values.name.trim().length < 3) errors.name = "name must be at least 3 characters";
  if (!EMAIL_PATTERN.test(values.email)) errors.email = "email is not valid";
  if (values.notes.length > 27) errors.notes = "notes must be at most 27 characters";
  return errors;
}

export function AlertWizard({ title = "Alert Wizard", initialValues, onSubmit, onCancel }: AlertWizardProps) {
  const [values, setValues] = useState<AlertValues>({ ...DEFAULTS, ...initialValues });
  const [touched, setTouched] = useState<Partial<Record<keyof AlertValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const errors = useMemo(() => validateAlert(values), [values]);
  const isValid = Object.keys(errors).length === 0;
  const isDirty = useMemo(
    () => (Object.keys(DEFAULTS) as (keyof AlertValues)[]).some((k) => values[k] !== { ...DEFAULTS, ...initialValues }[k]),
    [values, initialValues],
  );

  useEffect(() => {
    if (!savedAt) return;
    const timer = window.setTimeout(() => setSavedAt(null), 3250);
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  const update = useCallback(<K extends keyof AlertValues>(key: K, value: AlertValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const showError = (key: keyof AlertValues) => (submitted || touched[key]) && errors[key];

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
    <form className="alert-wizard" onSubmit={handleSubmit} noValidate>
      <h2>{title}</h2>
      <label htmlFor="alert-name">Name</label>
      <input id="alert-name" value={values.name} onChange={(e) => update("name", e.target.value)} />
      {showError("name") && <small role="alert">{errors.name}</small>}
      <label htmlFor="alert-email">Email</label>
      <input id="alert-email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
      {showError("email") && <small role="alert">{errors.email}</small>}
      <label htmlFor="alert-notes">Notes</label>
        <input id="alert-notes" value={values.notes} onChange={(e) => update("notes", e.target.value)} />
      {showError("notes") && <small role="alert">{errors.notes}</small>}
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

export default AlertWizard;
