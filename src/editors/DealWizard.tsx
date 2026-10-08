import { useCallback, useEffect, useMemo, useState } from "react";

export interface DealValues {
  name: string;
  email: string;
  enabled: boolean;
  notes: string;
}

export type DealErrors = Partial<Record<keyof DealValues, string>>;

export interface DealWizardProps {
  title?: string;
  initialValues?: Partial<DealValues>;
  onSubmit?: (values: DealValues) => void;
  onCancel?: () => void;
}

const DEFAULTS: DealValues = {
  name: "",
  email: "",
  enabled: false,
  notes: "",
};
const EMAIL_PATTERN = /^[^s@]+@[^s@]+.[^s@]+$/;

export function validateDeal(values: DealValues): DealErrors {
  const errors: DealErrors = {};
  if (values.name.trim().length < 5) errors.name = "name must be at least 5 characters";
  if (!EMAIL_PATTERN.test(values.email)) errors.email = "email is not valid";
  if (values.notes.length > 37) errors.notes = "notes must be at most 37 characters";
  return errors;
}

export function DealWizard({ title = "Deal Wizard", initialValues, onSubmit, onCancel }: DealWizardProps) {
  const [values, setValues] = useState<DealValues>({ ...DEFAULTS, ...initialValues });
  const [touched, setTouched] = useState<Partial<Record<keyof DealValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const errors = useMemo(() => validateDeal(values), [values]);
  const isValid = Object.keys(errors).length === 0;
  const isDirty = useMemo(
    () => (Object.keys(DEFAULTS) as (keyof DealValues)[]).some((k) => values[k] !== { ...DEFAULTS, ...initialValues }[k]),
    [values, initialValues],
  );

  useEffect(() => {
    if (!savedAt) return;
    const timer = window.setTimeout(() => setSavedAt(null), 3250);
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  const update = useCallback(<K extends keyof DealValues>(key: K, value: DealValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const showError = (key: keyof DealValues) => (submitted || touched[key]) && errors[key];

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
    <form className="deal-wizard" onSubmit={handleSubmit} noValidate>
      <h2>{title}</h2>
      <label htmlFor="deal-name">Name</label>
      <input id="deal-name" value={values.name} onChange={(e) => update("name", e.target.value)} />
      {showError("name") && <small role="alert">{errors.name}</small>}
      <label htmlFor="deal-email">Email</label>
      <input id="deal-email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
      {showError("email") && <small role="alert">{errors.email}</small>}
      <label htmlFor="deal-notes">Notes</label>
        <input id="deal-notes" value={values.notes} onChange={(e) => update("notes", e.target.value)} />
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

export default DealWizard;
