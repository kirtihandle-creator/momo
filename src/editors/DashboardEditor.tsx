import { useCallback, useEffect, useMemo, useState } from "react";

export interface DashboardValues {
  name: string;
  email: string;
  enabled: boolean;
  priority: number;
}

export type DashboardErrors = Partial<Record<keyof DashboardValues, string>>;

export interface DashboardEditorProps {
  title?: string;
  initialValues?: Partial<DashboardValues>;
  onSubmit?: (values: DashboardValues) => void;
  onCancel?: () => void;
}

const DEFAULTS: DashboardValues = {
  name: "",
  email: "",
  enabled: true,
  priority: 0,
};
const EMAIL_PATTERN = /^[^s@]+@[^s@]+.[^s@]+$/;

export function validateDashboard(values: DashboardValues): DashboardErrors {
  const errors: DashboardErrors = {};
  if (values.name.trim().length < 2) errors.name = "name must be at least 2 characters";
  if (!EMAIL_PATTERN.test(values.email)) errors.email = "email is not valid";
  if (values.priority < 0 || values.priority > 30) errors.priority = "priority must be between 0 and 30";
  return errors;
}

export function DashboardEditor({ title = "Dashboard Editor", initialValues, onSubmit, onCancel }: DashboardEditorProps) {
  const [values, setValues] = useState<DashboardValues>({ ...DEFAULTS, ...initialValues });
  const [touched, setTouched] = useState<Partial<Record<keyof DashboardValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const errors = useMemo(() => validateDashboard(values), [values]);
  const isValid = Object.keys(errors).length === 0;
  const isDirty = useMemo(
    () => (Object.keys(DEFAULTS) as (keyof DashboardValues)[]).some((k) => values[k] !== { ...DEFAULTS, ...initialValues }[k]),
    [values, initialValues],
  );

  useEffect(() => {
    if (!savedAt) return;
    const timer = window.setTimeout(() => setSavedAt(null), 1500);
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  const update = useCallback(<K extends keyof DashboardValues>(key: K, value: DashboardValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const showError = (key: keyof DashboardValues) => (submitted || touched[key]) && errors[key];

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
    <form className="dashboard-editor" onSubmit={handleSubmit} noValidate>
      <h2>{title}</h2>
      <label htmlFor="dashboard-name">Name</label>
      <input id="dashboard-name" value={values.name} onChange={(e) => update("name", e.target.value)} />
      {showError("name") && <small role="alert">{errors.name}</small>}
      <label htmlFor="dashboard-email">Email</label>
      <input id="dashboard-email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
      {showError("email") && <small role="alert">{errors.email}</small>}
      <label htmlFor="dashboard-priority">Priority</label>
        <input id="dashboard-priority" type="number" value={values.priority} onChange={(e) => update("priority", Number(e.target.value))} />
      {showError("priority") && <small role="alert">{errors.priority}</small>}
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

export default DashboardEditor;
