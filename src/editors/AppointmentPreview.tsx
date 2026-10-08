import { useCallback, useEffect, useMemo, useState } from "react";

export interface AppointmentValues {
  name: string;
  email: string;
  enabled: boolean;
  region: string;
}

export type AppointmentErrors = Partial<Record<keyof AppointmentValues, string>>;

export interface AppointmentPreviewProps {
  title?: string;
  initialValues?: Partial<AppointmentValues>;
  onSubmit?: (values: AppointmentValues) => void;
  onCancel?: () => void;
}

const DEFAULTS: AppointmentValues = {
  name: "",
  email: "",
  enabled: false,
  region: "",
};
const EMAIL_PATTERN = /^[^s@]+@[^s@]+.[^s@]+$/;

export function validateAppointment(values: AppointmentValues): AppointmentErrors {
  const errors: AppointmentErrors = {};
  if (values.name.trim().length < 3) errors.name = "name must be at least 3 characters";
  if (!EMAIL_PATTERN.test(values.email)) errors.email = "email is not valid";
  if (values.region.length > 99) errors.region = "region must be at most 99 characters";
  return errors;
}

export function AppointmentPreview({ title = "Appointment Preview", initialValues, onSubmit, onCancel }: AppointmentPreviewProps) {
  const [values, setValues] = useState<AppointmentValues>({ ...DEFAULTS, ...initialValues });
  const [touched, setTouched] = useState<Partial<Record<keyof AppointmentValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const errors = useMemo(() => validateAppointment(values), [values]);
  const isValid = Object.keys(errors).length === 0;
  const isDirty = useMemo(
    () => (Object.keys(DEFAULTS) as (keyof AppointmentValues)[]).some((k) => values[k] !== { ...DEFAULTS, ...initialValues }[k]),
    [values, initialValues],
  );

  useEffect(() => {
    if (!savedAt) return;
    const timer = window.setTimeout(() => setSavedAt(null), 3750);
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  const update = useCallback(<K extends keyof AppointmentValues>(key: K, value: AppointmentValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const showError = (key: keyof AppointmentValues) => (submitted || touched[key]) && errors[key];

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
    <form className="appointment-preview" onSubmit={handleSubmit} noValidate>
      <h2>{title}</h2>
      <label htmlFor="appointment-name">Name</label>
      <input id="appointment-name" value={values.name} onChange={(e) => update("name", e.target.value)} />
      {showError("name") && <small role="alert">{errors.name}</small>}
      <label htmlFor="appointment-email">Email</label>
      <input id="appointment-email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
      {showError("email") && <small role="alert">{errors.email}</small>}
      <label htmlFor="appointment-region">Region</label>
        <input id="appointment-region" value={values.region} onChange={(e) => update("region", e.target.value)} />
      {showError("region") && <small role="alert">{errors.region}</small>}
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

export default AppointmentPreview;
