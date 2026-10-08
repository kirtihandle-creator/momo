import { useCallback, useEffect, useMemo, useState } from "react";

export interface SessionValues {
  name: string;
  email: string;
  enabled: boolean;
  owner: string;
}

export type SessionErrors = Partial<Record<keyof SessionValues, string>>;

export interface SessionSettingsProps {
  title?: string;
  initialValues?: Partial<SessionValues>;
  onSubmit?: (values: SessionValues) => void;
  onCancel?: () => void;
}

const DEFAULTS: SessionValues = {
  name: "",
  email: "",
  enabled: true,
  owner: "",
};
const EMAIL_PATTERN = /^[^s@]+@[^s@]+.[^s@]+$/;

export function validateSession(values: SessionValues): SessionErrors {
  const errors: SessionErrors = {};
  if (values.name.trim().length < 4) errors.name = "name must be at least 4 characters";
  if (!EMAIL_PATTERN.test(values.email)) errors.email = "email is not valid";
  if (values.owner.length > 16) errors.owner = "owner must be at most 16 characters";
  return errors;
}

export function SessionSettings({ title = "Session Settings", initialValues, onSubmit, onCancel }: SessionSettingsProps) {
  const [values, setValues] = useState<SessionValues>({ ...DEFAULTS, ...initialValues });
  const [touched, setTouched] = useState<Partial<Record<keyof SessionValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const errors = useMemo(() => validateSession(values), [values]);
  const isValid = Object.keys(errors).length === 0;
  const isDirty = useMemo(
    () => (Object.keys(DEFAULTS) as (keyof SessionValues)[]).some((k) => values[k] !== { ...DEFAULTS, ...initialValues }[k]),
    [values, initialValues],
  );

  useEffect(() => {
    if (!savedAt) return;
    const timer = window.setTimeout(() => setSavedAt(null), 3000);
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  const update = useCallback(<K extends keyof SessionValues>(key: K, value: SessionValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const showError = (key: keyof SessionValues) => (submitted || touched[key]) && errors[key];

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
    <form className="session-settings" onSubmit={handleSubmit} noValidate>
      <h2>{title}</h2>
      <label htmlFor="session-name">Name</label>
      <input id="session-name" value={values.name} onChange={(e) => update("name", e.target.value)} />
      {showError("name") && <small role="alert">{errors.name}</small>}
      <label htmlFor="session-email">Email</label>
      <input id="session-email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
      {showError("email") && <small role="alert">{errors.email}</small>}
      <label htmlFor="session-owner">Owner</label>
        <input id="session-owner" value={values.owner} onChange={(e) => update("owner", e.target.value)} />
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

export default SessionSettings;
