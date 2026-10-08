import { useCallback, useEffect, useMemo, useState } from "react";

export interface RoomValues {
  name: string;
  email: string;
  enabled: boolean;
  priority: number;
}

export type RoomErrors = Partial<Record<keyof RoomValues, string>>;

export interface RoomEditorProps {
  title?: string;
  initialValues?: Partial<RoomValues>;
  onSubmit?: (values: RoomValues) => void;
  onCancel?: () => void;
}

const DEFAULTS: RoomValues = {
  name: "",
  email: "",
  enabled: true,
  priority: 0,
};
const EMAIL_PATTERN = /^[^s@]+@[^s@]+.[^s@]+$/;

export function validateRoom(values: RoomValues): RoomErrors {
  const errors: RoomErrors = {};
  if (values.name.trim().length < 4) errors.name = "name must be at least 4 characters";
  if (!EMAIL_PATTERN.test(values.email)) errors.email = "email is not valid";
  if (values.priority < 0 || values.priority > 80) errors.priority = "priority must be between 0 and 80";
  return errors;
}

export function RoomEditor({ title = "Room Editor", initialValues, onSubmit, onCancel }: RoomEditorProps) {
  const [values, setValues] = useState<RoomValues>({ ...DEFAULTS, ...initialValues });
  const [touched, setTouched] = useState<Partial<Record<keyof RoomValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const errors = useMemo(() => validateRoom(values), [values]);
  const isValid = Object.keys(errors).length === 0;
  const isDirty = useMemo(
    () => (Object.keys(DEFAULTS) as (keyof RoomValues)[]).some((k) => values[k] !== { ...DEFAULTS, ...initialValues }[k]),
    [values, initialValues],
  );

  useEffect(() => {
    if (!savedAt) return;
    const timer = window.setTimeout(() => setSavedAt(null), 1500);
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  const update = useCallback(<K extends keyof RoomValues>(key: K, value: RoomValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const showError = (key: keyof RoomValues) => (submitted || touched[key]) && errors[key];

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
    <form className="room-editor" onSubmit={handleSubmit} noValidate>
      <h2>{title}</h2>
      <label htmlFor="room-name">Name</label>
      <input id="room-name" value={values.name} onChange={(e) => update("name", e.target.value)} />
      {showError("name") && <small role="alert">{errors.name}</small>}
      <label htmlFor="room-email">Email</label>
      <input id="room-email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
      {showError("email") && <small role="alert">{errors.email}</small>}
      <label htmlFor="room-priority">Priority</label>
        <input id="room-priority" type="number" value={values.priority} onChange={(e) => update("priority", Number(e.target.value))} />
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

export default RoomEditor;
