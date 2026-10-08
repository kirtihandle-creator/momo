import { useCallback, useEffect, useMemo, useState } from "react";

export interface RefundValues {
  name: string;
  email: string;
  enabled: boolean;
  quantity: number;
}

export type RefundErrors = Partial<Record<keyof RefundValues, string>>;

export interface RefundDetailsProps {
  title?: string;
  initialValues?: Partial<RefundValues>;
  onSubmit?: (values: RefundValues) => void;
  onCancel?: () => void;
}

const DEFAULTS: RefundValues = {
  name: "",
  email: "",
  enabled: false,
  quantity: 0,
};
const EMAIL_PATTERN = /^[^s@]+@[^s@]+.[^s@]+$/;

export function validateRefund(values: RefundValues): RefundErrors {
  const errors: RefundErrors = {};
  if (values.name.trim().length < 3) errors.name = "name must be at least 3 characters";
  if (!EMAIL_PATTERN.test(values.email)) errors.email = "email is not valid";
  if (values.quantity < 0 || values.quantity > 23) errors.quantity = "quantity must be between 0 and 23";
  return errors;
}

export function RefundDetails({ title = "Refund Details", initialValues, onSubmit, onCancel }: RefundDetailsProps) {
  const [values, setValues] = useState<RefundValues>({ ...DEFAULTS, ...initialValues });
  const [touched, setTouched] = useState<Partial<Record<keyof RefundValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const errors = useMemo(() => validateRefund(values), [values]);
  const isValid = Object.keys(errors).length === 0;
  const isDirty = useMemo(
    () => (Object.keys(DEFAULTS) as (keyof RefundValues)[]).some((k) => values[k] !== { ...DEFAULTS, ...initialValues }[k]),
    [values, initialValues],
  );

  useEffect(() => {
    if (!savedAt) return;
    const timer = window.setTimeout(() => setSavedAt(null), 2250);
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  const update = useCallback(<K extends keyof RefundValues>(key: K, value: RefundValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const showError = (key: keyof RefundValues) => (submitted || touched[key]) && errors[key];

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
    <form className="refund-details" onSubmit={handleSubmit} noValidate>
      <h2>{title}</h2>
      <label htmlFor="refund-name">Name</label>
      <input id="refund-name" value={values.name} onChange={(e) => update("name", e.target.value)} />
      {showError("name") && <small role="alert">{errors.name}</small>}
      <label htmlFor="refund-email">Email</label>
      <input id="refund-email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
      {showError("email") && <small role="alert">{errors.email}</small>}
      <label htmlFor="refund-quantity">Quantity</label>
        <input id="refund-quantity" type="number" value={values.quantity} onChange={(e) => update("quantity", Number(e.target.value))} />
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

export default RefundDetails;
