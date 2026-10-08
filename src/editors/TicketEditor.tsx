import { useCallback, useEffect, useMemo, useState } from "react";

export interface TicketValues {
  name: string;
  email: string;
  enabled: boolean;
  priority: number;
}

export type TicketErrors = Partial<Record<keyof TicketValues, string>>;

export interface TicketEditorProps {
  title?: string;
  initialValues?: Partial<TicketValues>;
  onSubmit?: (values: TicketValues) => void;
  onCancel?: () => void;
}

const DEFAULTS: TicketValues = {
  name: "",
  email: "",
  enabled: false,
  priority: 0,
};
const EMAIL_PATTERN = /^[^s@]+@[^s@]+.[^s@]+$/;

export function validateTicket(values: TicketValues): TicketErrors {
  const errors: TicketErrors = {};
  if (values.name.trim().length < 3) errors.name = "name must be at least 3 characters";
  if (!EMAIL_PATTERN.test(values.email)) errors.email = "email is not valid";
  if (values.priority < 0 || values.priority > 15) errors.priority = "priority must be between 0 and 15";
  return errors;
}

export function TicketEditor({ title = "Ticket Editor", initialValues, onSubmit, onCancel }: TicketEditorProps) {
  const [values, setValues] = useState<TicketValues>({ ...DEFAULTS, ...initialValues });
  const [touched, setTouched] = useState<Partial<Record<keyof TicketValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const errors = useMemo(() => validateTicket(values), [values]);
  const isValid = Object.keys(errors).length === 0;
  const isDirty = useMemo(
    () => (Object.keys(DEFAULTS) as (keyof TicketValues)[]).some((k) => values[k] !== { ...DEFAULTS, ...initialValues }[k]),
    [values, initialValues],
  );

  useEffect(() => {
    if (!savedAt) return;
    const timer = window.setTimeout(() => setSavedAt(null), 2750);
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  const update = useCallback(<K extends keyof TicketValues>(key: K, value: TicketValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const showError = (key: keyof TicketValues) => (submitted || touched[key]) && errors[key];

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
    <form className="ticket-editor" onSubmit={handleSubmit} noValidate>
      <h2>{title}</h2>
      <label htmlFor="ticket-name">Name</label>
      <input id="ticket-name" value={values.name} onChange={(e) => update("name", e.target.value)} />
      {showError("name") && <small role="alert">{errors.name}</small>}
      <label htmlFor="ticket-email">Email</label>
      <input id="ticket-email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
      {showError("email") && <small role="alert">{errors.email}</small>}
      <label htmlFor="ticket-priority">Priority</label>
        <input id="ticket-priority" type="number" value={values.priority} onChange={(e) => update("priority", Number(e.target.value))} />
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

export default TicketEditor;
