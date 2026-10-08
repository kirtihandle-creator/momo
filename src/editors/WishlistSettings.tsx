import { useCallback, useEffect, useMemo, useState } from "react";

export interface WishlistValues {
  name: string;
  email: string;
  enabled: boolean;
  owner: string;
}

export type WishlistErrors = Partial<Record<keyof WishlistValues, string>>;

export interface WishlistSettingsProps {
  title?: string;
  initialValues?: Partial<WishlistValues>;
  onSubmit?: (values: WishlistValues) => void;
  onCancel?: () => void;
}

const DEFAULTS: WishlistValues = {
  name: "",
  email: "",
  enabled: true,
  owner: "",
};
const EMAIL_PATTERN = /^[^s@]+@[^s@]+.[^s@]+$/;

export function validateWishlist(values: WishlistValues): WishlistErrors {
  const errors: WishlistErrors = {};
  if (values.name.trim().length < 2) errors.name = "name must be at least 2 characters";
  if (!EMAIL_PATTERN.test(values.email)) errors.email = "email is not valid";
  if (values.owner.length > 26) errors.owner = "owner must be at most 26 characters";
  return errors;
}

export function WishlistSettings({ title = "Wishlist Settings", initialValues, onSubmit, onCancel }: WishlistSettingsProps) {
  const [values, setValues] = useState<WishlistValues>({ ...DEFAULTS, ...initialValues });
  const [touched, setTouched] = useState<Partial<Record<keyof WishlistValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const errors = useMemo(() => validateWishlist(values), [values]);
  const isValid = Object.keys(errors).length === 0;
  const isDirty = useMemo(
    () => (Object.keys(DEFAULTS) as (keyof WishlistValues)[]).some((k) => values[k] !== { ...DEFAULTS, ...initialValues }[k]),
    [values, initialValues],
  );

  useEffect(() => {
    if (!savedAt) return;
    const timer = window.setTimeout(() => setSavedAt(null), 3000);
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  const update = useCallback(<K extends keyof WishlistValues>(key: K, value: WishlistValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const showError = (key: keyof WishlistValues) => (submitted || touched[key]) && errors[key];

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
    <form className="wishlist-settings" onSubmit={handleSubmit} noValidate>
      <h2>{title}</h2>
      <label htmlFor="wishlist-name">Name</label>
      <input id="wishlist-name" value={values.name} onChange={(e) => update("name", e.target.value)} />
      {showError("name") && <small role="alert">{errors.name}</small>}
      <label htmlFor="wishlist-email">Email</label>
      <input id="wishlist-email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
      {showError("email") && <small role="alert">{errors.email}</small>}
      <label htmlFor="wishlist-owner">Owner</label>
        <input id="wishlist-owner" value={values.owner} onChange={(e) => update("owner", e.target.value)} />
      {showError("owner") && <small role="alert">{errors.owner}</small>}
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

export default WishlistSettings;
