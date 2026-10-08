import { useCallback, useEffect, useMemo, useState } from "react";

export interface WidgetValues {
  name: string;
  email: string;
  enabled: boolean;
  owner: string;
}

export type WidgetErrors = Partial<Record<keyof WidgetValues, string>>;

export interface WidgetSettingsProps {
  title?: string;
  initialValues?: Partial<WidgetValues>;
  onSubmit?: (values: WidgetValues) => void;
  onCancel?: () => void;
}

const DEFAULTS: WidgetValues = {
  name: "",
  email: "",
  enabled: false,
  owner: "",
};
const EMAIL_PATTERN = /^[^s@]+@[^s@]+.[^s@]+$/;

export function validateWidget(values: WidgetValues): WidgetErrors {
  const errors: WidgetErrors = {};
  if (values.name.trim().length < 3) errors.name = "name must be at least 3 characters";
  if (!EMAIL_PATTERN.test(values.email)) errors.email = "email is not valid";
  if (values.owner.length > 31) errors.owner = "owner must be at most 31 characters";
  return errors;
}

export function WidgetSettings({ title = "Widget Settings", initialValues, onSubmit, onCancel }: WidgetSettingsProps) {
  const [values, setValues] = useState<WidgetValues>({ ...DEFAULTS, ...initialValues });
  const [touched, setTouched] = useState<Partial<Record<keyof WidgetValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const errors = useMemo(() => validateWidget(values), [values]);
  const isValid = Object.keys(errors).length === 0;
  const isDirty = useMemo(
    () => (Object.keys(DEFAULTS) as (keyof WidgetValues)[]).some((k) => values[k] !== { ...DEFAULTS, ...initialValues }[k]),
    [values, initialValues],
  );

  useEffect(() => {
    if (!savedAt) return;
    const timer = window.setTimeout(() => setSavedAt(null), 1750);
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  const update = useCallback(<K extends keyof WidgetValues>(key: K, value: WidgetValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const showError = (key: keyof WidgetValues) => (submitted || touched[key]) && errors[key];

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
    <form className="widget-settings" onSubmit={handleSubmit} noValidate>
      <h2>{title}</h2>
      <label htmlFor="widget-name">Name</label>
      <input id="widget-name" value={values.name} onChange={(e) => update("name", e.target.value)} />
      {showError("name") && <small role="alert">{errors.name}</small>}
      <label htmlFor="widget-email">Email</label>
      <input id="widget-email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
      {showError("email") && <small role="alert">{errors.email}</small>}
      <label htmlFor="widget-owner">Owner</label>
        <input id="widget-owner" value={values.owner} onChange={(e) => update("owner", e.target.value)} />
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

export default WidgetSettings;
