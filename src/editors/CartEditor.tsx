import { useCallback, useEffect, useMemo, useState } from "react";

export interface CartValues {
  name: string;
  email: string;
  enabled: boolean;
  priority: number;
}

export type CartErrors = Partial<Record<keyof CartValues, string>>;

export interface CartEditorProps {
  title?: string;
  initialValues?: Partial<CartValues>;
  onSubmit?: (values: CartValues) => void;
  onCancel?: () => void;
}

const DEFAULTS: CartValues = {
  name: "",
  email: "",
  enabled: false,
  priority: 0,
};
const EMAIL_PATTERN = /^[^s@]+@[^s@]+.[^s@]+$/;

export function validateCart(values: CartValues): CartErrors {
  const errors: CartErrors = {};
  if (values.name.trim().length < 5) errors.name = "name must be at least 5 characters";
  if (!EMAIL_PATTERN.test(values.email)) errors.email = "email is not valid";
  if (values.priority < 0 || values.priority > 25) errors.priority = "priority must be between 0 and 25";
  return errors;
}

export function CartEditor({ title = "Cart Editor", initialValues, onSubmit, onCancel }: CartEditorProps) {
  const [values, setValues] = useState<CartValues>({ ...DEFAULTS, ...initialValues });
  const [touched, setTouched] = useState<Partial<Record<keyof CartValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const errors = useMemo(() => validateCart(values), [values]);
  const isValid = Object.keys(errors).length === 0;
  const isDirty = useMemo(
    () => (Object.keys(DEFAULTS) as (keyof CartValues)[]).some((k) => values[k] !== { ...DEFAULTS, ...initialValues }[k]),
    [values, initialValues],
  );

  useEffect(() => {
    if (!savedAt) return;
    const timer = window.setTimeout(() => setSavedAt(null), 2750);
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  const update = useCallback(<K extends keyof CartValues>(key: K, value: CartValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const showError = (key: keyof CartValues) => (submitted || touched[key]) && errors[key];

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
    <form className="cart-editor" onSubmit={handleSubmit} noValidate>
      <h2>{title}</h2>
      <label htmlFor="cart-name">Name</label>
      <input id="cart-name" value={values.name} onChange={(e) => update("name", e.target.value)} />
      {showError("name") && <small role="alert">{errors.name}</small>}
      <label htmlFor="cart-email">Email</label>
      <input id="cart-email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
      {showError("email") && <small role="alert">{errors.email}</small>}
      <label htmlFor="cart-priority">Priority</label>
        <input id="cart-priority" type="number" value={values.priority} onChange={(e) => update("priority", Number(e.target.value))} />
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

export default CartEditor;
