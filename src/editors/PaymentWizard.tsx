import { useCallback, useEffect, useMemo, useState } from "react";

export interface PaymentValues {
  name: string;
  email: string;
  enabled: boolean;
  notes: string;
}

export type PaymentErrors = Partial<Record<keyof PaymentValues, string>>;

export interface PaymentWizardProps {
  title?: string;
  initialValues?: Partial<PaymentValues>;
  onSubmit?: (values: PaymentValues) => void;
  onCancel?: () => void;
}

const DEFAULTS: PaymentValues = {
  name: "",
  email: "",
  enabled: true,
  notes: "",
};
const EMAIL_PATTERN = /^[^s@]+@[^s@]+.[^s@]+$/;

export function validatePayment(values: PaymentValues): PaymentErrors {
  const errors: PaymentErrors = {};
  if (values.name.trim().length < 2) errors.name = "name must be at least 2 characters";
  if (!EMAIL_PATTERN.test(values.email)) errors.email = "email is not valid";
  if (values.notes.length > 22) errors.notes = "notes must be at most 22 characters";
  return errors;
}

export function PaymentWizard({ title = "Payment Wizard", initialValues, onSubmit, onCancel }: PaymentWizardProps) {
  const [values, setValues] = useState<PaymentValues>({ ...DEFAULTS, ...initialValues });
  const [touched, setTouched] = useState<Partial<Record<keyof PaymentValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const errors = useMemo(() => validatePayment(values), [values]);
  const isValid = Object.keys(errors).length === 0;
  const isDirty = useMemo(
    () => (Object.keys(DEFAULTS) as (keyof PaymentValues)[]).some((k) => values[k] !== { ...DEFAULTS, ...initialValues }[k]),
    [values, initialValues],
  );

  useEffect(() => {
    if (!savedAt) return;
    const timer = window.setTimeout(() => setSavedAt(null), 2000);
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  const update = useCallback(<K extends keyof PaymentValues>(key: K, value: PaymentValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const showError = (key: keyof PaymentValues) => (submitted || touched[key]) && errors[key];

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
    <form className="payment-wizard" onSubmit={handleSubmit} noValidate>
      <h2>{title}</h2>
      <label htmlFor="payment-name">Name</label>
      <input id="payment-name" value={values.name} onChange={(e) => update("name", e.target.value)} />
      {showError("name") && <small role="alert">{errors.name}</small>}
      <label htmlFor="payment-email">Email</label>
      <input id="payment-email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
      {showError("email") && <small role="alert">{errors.email}</small>}
      <label htmlFor="payment-notes">Notes</label>
        <input id="payment-notes" value={values.notes} onChange={(e) => update("notes", e.target.value)} />
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

export default PaymentWizard;
