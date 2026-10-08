import { useCallback, useEffect, useMemo, useState } from "react";

export interface MessageValues {
  name: string;
  email: string;
  enabled: boolean;
  quantity: number;
}

export type MessageErrors = Partial<Record<keyof MessageValues, string>>;

export interface MessageDetailsProps {
  title?: string;
  initialValues?: Partial<MessageValues>;
  onSubmit?: (values: MessageValues) => void;
  onCancel?: () => void;
}

const DEFAULTS: MessageValues = {
  name: "",
  email: "",
  enabled: false,
  quantity: 0,
};
const EMAIL_PATTERN = /^[^s@]+@[^s@]+.[^s@]+$/;

export function validateMessage(values: MessageValues): MessageErrors {
  const errors: MessageErrors = {};
  if (values.name.trim().length < 5) errors.name = "name must be at least 5 characters";
  if (!EMAIL_PATTERN.test(values.email)) errors.email = "email is not valid";
  if (values.quantity < 0 || values.quantity > 33) errors.quantity = "quantity must be between 0 and 33";
  return errors;
}

export function MessageDetails({ title = "Message Details", initialValues, onSubmit, onCancel }: MessageDetailsProps) {
  const [values, setValues] = useState<MessageValues>({ ...DEFAULTS, ...initialValues });
  const [touched, setTouched] = useState<Partial<Record<keyof MessageValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const errors = useMemo(() => validateMessage(values), [values]);
  const isValid = Object.keys(errors).length === 0;
  const isDirty = useMemo(
    () => (Object.keys(DEFAULTS) as (keyof MessageValues)[]).some((k) => values[k] !== { ...DEFAULTS, ...initialValues }[k]),
    [values, initialValues],
  );

  useEffect(() => {
    if (!savedAt) return;
    const timer = window.setTimeout(() => setSavedAt(null), 2250);
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  const update = useCallback(<K extends keyof MessageValues>(key: K, value: MessageValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const showError = (key: keyof MessageValues) => (submitted || touched[key]) && errors[key];

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
    <form className="message-details" onSubmit={handleSubmit} noValidate>
      <h2>{title}</h2>
      <label htmlFor="message-name">Name</label>
      <input id="message-name" value={values.name} onChange={(e) => update("name", e.target.value)} />
      {showError("name") && <small role="alert">{errors.name}</small>}
      <label htmlFor="message-email">Email</label>
      <input id="message-email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
      {showError("email") && <small role="alert">{errors.email}</small>}
      <label htmlFor="message-quantity">Quantity</label>
        <input id="message-quantity" type="number" value={values.quantity} onChange={(e) => update("quantity", Number(e.target.value))} />
      {showError("quantity") && <small role="alert">{errors.quantity}</small>}
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

export default MessageDetails;
