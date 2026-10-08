import { useCallback, useEffect, useMemo, useState } from "react";

export interface RoleValues {
  name: string;
  email: string;
  enabled: boolean;
  notes: string;
}

export type RoleErrors = Partial<Record<keyof RoleValues, string>>;

export interface RoleWizardProps {
  title?: string;
  initialValues?: Partial<RoleValues>;
  onSubmit?: (values: RoleValues) => void;
  onCancel?: () => void;
}

const DEFAULTS: RoleValues = {
  name: "",
  email: "",
  enabled: true,
  notes: "",
};
const EMAIL_PATTERN = /^[^s@]+@[^s@]+.[^s@]+$/;

export function validateRole(values: RoleValues): RoleErrors {
  const errors: RoleErrors = {};
  if (values.name.trim().length < 4) errors.name = "name must be at least 4 characters";
  if (!EMAIL_PATTERN.test(values.email)) errors.email = "email is not valid";
  if (values.notes.length > 52) errors.notes = "notes must be at most 52 characters";
  return errors;
}

export function RoleWizard({ title = "Role Wizard", initialValues, onSubmit, onCancel }: RoleWizardProps) {
  const [values, setValues] = useState<RoleValues>({ ...DEFAULTS, ...initialValues });
  const [touched, setTouched] = useState<Partial<Record<keyof RoleValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const errors = useMemo(() => validateRole(values), [values]);
  const isValid = Object.keys(errors).length === 0;
  const isDirty = useMemo(
    () => (Object.keys(DEFAULTS) as (keyof RoleValues)[]).some((k) => values[k] !== { ...DEFAULTS, ...initialValues }[k]),
    [values, initialValues],
  );

  useEffect(() => {
    if (!savedAt) return;
    const timer = window.setTimeout(() => setSavedAt(null), 2000);
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  const update = useCallback(<K extends keyof RoleValues>(key: K, value: RoleValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const showError = (key: keyof RoleValues) => (submitted || touched[key]) && errors[key];

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
    <form className="role-wizard" onSubmit={handleSubmit} noValidate>
      <h2>{title}</h2>
      <label htmlFor="role-name">Name</label>
      <input id="role-name" value={values.name} onChange={(e) => update("name", e.target.value)} />
      {showError("name") && <small role="alert">{errors.name}</small>}
      <label htmlFor="role-email">Email</label>
      <input id="role-email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
      {showError("email") && <small role="alert">{errors.email}</small>}
      <label htmlFor="role-notes">Notes</label>
        <input id="role-notes" value={values.notes} onChange={(e) => update("notes", e.target.value)} />
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

export default RoleWizard;
