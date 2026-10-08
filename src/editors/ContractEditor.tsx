import { useCallback, useEffect, useMemo, useState } from "react";

export interface ContractValues {
  name: string;
  email: string;
  enabled: boolean;
  priority: number;
}

export type ContractErrors = Partial<Record<keyof ContractValues, string>>;

export interface ContractEditorProps {
  title?: string;
  initialValues?: Partial<ContractValues>;
  onSubmit?: (values: ContractValues) => void;
  onCancel?: () => void;
}

const DEFAULTS: ContractValues = {
  name: "",
  email: "",
  enabled: false,
  priority: 0,
};
const EMAIL_PATTERN = /^[^s@]+@[^s@]+.[^s@]+$/;

export function validateContract(values: ContractValues): ContractErrors {
  const errors: ContractErrors = {};
  if (values.name.trim().length < 5) errors.name = "name must be at least 5 characters";
  if (!EMAIL_PATTERN.test(values.email)) errors.email = "email is not valid";
  if (values.priority < 0 || values.priority > 15) errors.priority = "priority must be between 0 and 15";
  return errors;
}

export function ContractEditor({ title = "Contract Editor", initialValues, onSubmit, onCancel }: ContractEditorProps) {
  const [values, setValues] = useState<ContractValues>({ ...DEFAULTS, ...initialValues });
  const [touched, setTouched] = useState<Partial<Record<keyof ContractValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const errors = useMemo(() => validateContract(values), [values]);
  const isValid = Object.keys(errors).length === 0;
  const isDirty = useMemo(
    () => (Object.keys(DEFAULTS) as (keyof ContractValues)[]).some((k) => values[k] !== { ...DEFAULTS, ...initialValues }[k]),
    [values, initialValues],
  );

  useEffect(() => {
    if (!savedAt) return;
    const timer = window.setTimeout(() => setSavedAt(null), 2750);
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  const update = useCallback(<K extends keyof ContractValues>(key: K, value: ContractValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const showError = (key: keyof ContractValues) => (submitted || touched[key]) && errors[key];

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
    <form className="contract-editor" onSubmit={handleSubmit} noValidate>
      <h2>{title}</h2>
      <label htmlFor="contract-name">Name</label>
      <input id="contract-name" value={values.name} onChange={(e) => update("name", e.target.value)} />
      {showError("name") && <small role="alert">{errors.name}</small>}
      <label htmlFor="contract-email">Email</label>
      <input id="contract-email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
      {showError("email") && <small role="alert">{errors.email}</small>}
      <label htmlFor="contract-priority">Priority</label>
        <input id="contract-priority" type="number" value={values.priority} onChange={(e) => update("priority", Number(e.target.value))} />
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

export default ContractEditor;
