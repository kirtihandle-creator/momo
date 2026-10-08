import { useCallback, useEffect, useMemo, useState } from "react";

export interface WarehouseValues {
  name: string;
  email: string;
  enabled: boolean;
  quantity: number;
}

export type WarehouseErrors = Partial<Record<keyof WarehouseValues, string>>;

export interface WarehouseDetailsProps {
  title?: string;
  initialValues?: Partial<WarehouseValues>;
  onSubmit?: (values: WarehouseValues) => void;
  onCancel?: () => void;
}

const DEFAULTS: WarehouseValues = {
  name: "",
  email: "",
  enabled: false,
  quantity: 0,
};
const EMAIL_PATTERN = /^[^s@]+@[^s@]+.[^s@]+$/;

export function validateWarehouse(values: WarehouseValues): WarehouseErrors {
  const errors: WarehouseErrors = {};
  if (values.name.trim().length < 3) errors.name = "name must be at least 3 characters";
  if (!EMAIL_PATTERN.test(values.email)) errors.email = "email is not valid";
  if (values.quantity < 0 || values.quantity > 13) errors.quantity = "quantity must be between 0 and 13";
  return errors;
}

export function WarehouseDetails({ title = "Warehouse Details", initialValues, onSubmit, onCancel }: WarehouseDetailsProps) {
  const [values, setValues] = useState<WarehouseValues>({ ...DEFAULTS, ...initialValues });
  const [touched, setTouched] = useState<Partial<Record<keyof WarehouseValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const errors = useMemo(() => validateWarehouse(values), [values]);
  const isValid = Object.keys(errors).length === 0;
  const isDirty = useMemo(
    () => (Object.keys(DEFAULTS) as (keyof WarehouseValues)[]).some((k) => values[k] !== { ...DEFAULTS, ...initialValues }[k]),
    [values, initialValues],
  );

  useEffect(() => {
    if (!savedAt) return;
    const timer = window.setTimeout(() => setSavedAt(null), 2250);
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  const update = useCallback(<K extends keyof WarehouseValues>(key: K, value: WarehouseValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const showError = (key: keyof WarehouseValues) => (submitted || touched[key]) && errors[key];

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
    <form className="warehouse-details" onSubmit={handleSubmit} noValidate>
      <h2>{title}</h2>
      <label htmlFor="warehouse-name">Name</label>
      <input id="warehouse-name" value={values.name} onChange={(e) => update("name", e.target.value)} />
      {showError("name") && <small role="alert">{errors.name}</small>}
      <label htmlFor="warehouse-email">Email</label>
      <input id="warehouse-email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
      {showError("email") && <small role="alert">{errors.email}</small>}
      <label htmlFor="warehouse-quantity">Quantity</label>
        <input id="warehouse-quantity" type="number" value={values.quantity} onChange={(e) => update("quantity", Number(e.target.value))} />
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

export default WarehouseDetails;
