import { useCallback, useEffect, useMemo, useState } from "react";

export interface EventValues {
  name: string;
  email: string;
  enabled: boolean;
  notes: string;
}

export type EventErrors = Partial<Record<keyof EventValues, string>>;

export interface EventWizardProps {
  title?: string;
  initialValues?: Partial<EventValues>;
  onSubmit?: (values: EventValues) => void;
  onCancel?: () => void;
}

const DEFAULTS: EventValues = {
  name: "",
  email: "",
  enabled: false,
  notes: "",
};
const EMAIL_PATTERN = /^[^s@]+@[^s@]+.[^s@]+$/;

export function validateEvent(values: EventValues): EventErrors {
  const errors: EventErrors = {};
  if (values.name.trim().length < 5) errors.name = "name must be at least 5 characters";
  if (!EMAIL_PATTERN.test(values.email)) errors.email = "email is not valid";
  if (values.notes.length > 57) errors.notes = "notes must be at most 57 characters";
  return errors;
}

export function EventWizard({ title = "Event Wizard", initialValues, onSubmit, onCancel }: EventWizardProps) {
  const [values, setValues] = useState<EventValues>({ ...DEFAULTS, ...initialValues });
  const [touched, setTouched] = useState<Partial<Record<keyof EventValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const errors = useMemo(() => validateEvent(values), [values]);
  const isValid = Object.keys(errors).length === 0;
  const isDirty = useMemo(
    () => (Object.keys(DEFAULTS) as (keyof EventValues)[]).some((k) => values[k] !== { ...DEFAULTS, ...initialValues }[k]),
    [values, initialValues],
  );

  useEffect(() => {
    if (!savedAt) return;
    const timer = window.setTimeout(() => setSavedAt(null), 3250);
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  const update = useCallback(<K extends keyof EventValues>(key: K, value: EventValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const showError = (key: keyof EventValues) => (submitted || touched[key]) && errors[key];

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
    <form className="event-wizard" onSubmit={handleSubmit} noValidate>
      <h2>{title}</h2>
      <label htmlFor="event-name">Name</label>
      <input id="event-name" value={values.name} onChange={(e) => update("name", e.target.value)} />
      {showError("name") && <small role="alert">{errors.name}</small>}
      <label htmlFor="event-email">Email</label>
      <input id="event-email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
      {showError("email") && <small role="alert">{errors.email}</small>}
      <label htmlFor="event-notes">Notes</label>
        <input id="event-notes" value={values.notes} onChange={(e) => update("notes", e.target.value)} />
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

export default EventWizard;
