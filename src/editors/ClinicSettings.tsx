import { useCallback, useEffect, useMemo, useState } from "react";

export interface ClinicValues {
  name: string;
  email: string;
  enabled: boolean;
  owner: string;
}

export type ClinicErrors = Partial<Record<keyof ClinicValues, string>>;

export interface ClinicSettingsProps {
  title?: string;
  initialValues?: Partial<ClinicValues>;
  onSubmit?: (values: ClinicValues) => void;
  onCancel?: () => void;
}

const DEFAULTS: ClinicValues = {
  name: "",
  email: "",
  enabled: false,
  owner: "",
};
const EMAIL_PATTERN = /^[^s@]+@[^s@]+.[^s@]+$/;

export function validateClinic(values: ClinicValues): ClinicErrors {
  const errors: ClinicErrors = {};
  if (values.name.trim().length < 5) errors.name = "name must be at least 5 characters";
  if (!EMAIL_PATTERN.test(values.email)) errors.email = "email is not valid";
  if (values.owner.length > 11) errors.owner = "owner must be at most 11 characters";
  return errors;
}

export function ClinicSettings({ title = "Clinic Settings", initialValues, onSubmit, onCancel }: ClinicSettingsProps) {
  const [values, setValues] = useState<ClinicValues>({ ...DEFAULTS, ...initialValues });
  const [touched, setTouched] = useState<Partial<Record<keyof ClinicValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const errors = useMemo(() => validateClinic(values), [values]);
  const isValid = Object.keys(errors).length === 0;
  const isDirty = useMemo(
    () => (Object.keys(DEFAULTS) as (keyof ClinicValues)[]).some((k) => values[k] !== { ...DEFAULTS, ...initialValues }[k]),
    [values, initialValues],
  );

  useEffect(() => {
    if (!savedAt) return;
    const timer = window.setTimeout(() => setSavedAt(null), 1750);
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  const update = useCallback(<K extends keyof ClinicValues>(key: K, value: ClinicValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const showError = (key: keyof ClinicValues) => (submitted || touched[key]) && errors[key];

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
    <form className="clinic-settings" onSubmit={handleSubmit} noValidate>
      <h2>{title}</h2>
      <label htmlFor="clinic-name">Name</label>
      <input id="clinic-name" value={values.name} onChange={(e) => update("name", e.target.value)} />
      {showError("name") && <small role="alert">{errors.name}</small>}
      <label htmlFor="clinic-email">Email</label>
      <input id="clinic-email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
      {showError("email") && <small role="alert">{errors.email}</small>}
      <label htmlFor="clinic-owner">Owner</label>
        <input id="clinic-owner" value={values.owner} onChange={(e) => update("owner", e.target.value)} />
      {showError("owner") && <small role="alert">{errors.owner}</small>}
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

export default ClinicSettings;
