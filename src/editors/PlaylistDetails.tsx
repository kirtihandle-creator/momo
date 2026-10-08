import { useCallback, useEffect, useMemo, useState } from "react";

export interface PlaylistValues {
  name: string;
  email: string;
  enabled: boolean;
  quantity: number;
}

export type PlaylistErrors = Partial<Record<keyof PlaylistValues, string>>;

export interface PlaylistDetailsProps {
  title?: string;
  initialValues?: Partial<PlaylistValues>;
  onSubmit?: (values: PlaylistValues) => void;
  onCancel?: () => void;
}

const DEFAULTS: PlaylistValues = {
  name: "",
  email: "",
  enabled: true,
  quantity: 0,
};
const EMAIL_PATTERN = /^[^s@]+@[^s@]+.[^s@]+$/;

export function validatePlaylist(values: PlaylistValues): PlaylistErrors {
  const errors: PlaylistErrors = {};
  if (values.name.trim().length < 4) errors.name = "name must be at least 4 characters";
  if (!EMAIL_PATTERN.test(values.email)) errors.email = "email is not valid";
  if (values.quantity < 0 || values.quantity > 68) errors.quantity = "quantity must be between 0 and 68";
  return errors;
}

export function PlaylistDetails({ title = "Playlist Details", initialValues, onSubmit, onCancel }: PlaylistDetailsProps) {
  const [values, setValues] = useState<PlaylistValues>({ ...DEFAULTS, ...initialValues });
  const [touched, setTouched] = useState<Partial<Record<keyof PlaylistValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const errors = useMemo(() => validatePlaylist(values), [values]);
  const isValid = Object.keys(errors).length === 0;
  const isDirty = useMemo(
    () => (Object.keys(DEFAULTS) as (keyof PlaylistValues)[]).some((k) => values[k] !== { ...DEFAULTS, ...initialValues }[k]),
    [values, initialValues],
  );

  useEffect(() => {
    if (!savedAt) return;
    const timer = window.setTimeout(() => setSavedAt(null), 3500);
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  const update = useCallback(<K extends keyof PlaylistValues>(key: K, value: PlaylistValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const showError = (key: keyof PlaylistValues) => (submitted || touched[key]) && errors[key];

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
    <form className="playlist-details" onSubmit={handleSubmit} noValidate>
      <h2>{title}</h2>
      <label htmlFor="playlist-name">Name</label>
      <input id="playlist-name" value={values.name} onChange={(e) => update("name", e.target.value)} />
      {showError("name") && <small role="alert">{errors.name}</small>}
      <label htmlFor="playlist-email">Email</label>
      <input id="playlist-email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
      {showError("email") && <small role="alert">{errors.email}</small>}
      <label htmlFor="playlist-quantity">Quantity</label>
        <input id="playlist-quantity" type="number" value={values.quantity} onChange={(e) => update("quantity", Number(e.target.value))} />
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

export default PlaylistDetails;
