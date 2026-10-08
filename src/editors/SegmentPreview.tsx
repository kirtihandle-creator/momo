import { useCallback, useEffect, useMemo, useState } from "react";

export interface SegmentValues {
  name: string;
  email: string;
  enabled: boolean;
  region: string;
}

export type SegmentErrors = Partial<Record<keyof SegmentValues, string>>;

export interface SegmentPreviewProps {
  title?: string;
  initialValues?: Partial<SegmentValues>;
  onSubmit?: (values: SegmentValues) => void;
  onCancel?: () => void;
}

const DEFAULTS: SegmentValues = {
  name: "",
  email: "",
  enabled: false,
  region: "",
};
const EMAIL_PATTERN = /^[^s@]+@[^s@]+.[^s@]+$/;

export function validateSegment(values: SegmentValues): SegmentErrors {
  const errors: SegmentErrors = {};
  if (values.name.trim().length < 3) errors.name = "name must be at least 3 characters";
  if (!EMAIL_PATTERN.test(values.email)) errors.email = "email is not valid";
  if (values.region.length > 39) errors.region = "region must be at most 39 characters";
  return errors;
}

export function SegmentPreview({ title = "Segment Preview", initialValues, onSubmit, onCancel }: SegmentPreviewProps) {
  const [values, setValues] = useState<SegmentValues>({ ...DEFAULTS, ...initialValues });
  const [touched, setTouched] = useState<Partial<Record<keyof SegmentValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const errors = useMemo(() => validateSegment(values), [values]);
  const isValid = Object.keys(errors).length === 0;
  const isDirty = useMemo(
    () => (Object.keys(DEFAULTS) as (keyof SegmentValues)[]).some((k) => values[k] !== { ...DEFAULTS, ...initialValues }[k]),
    [values, initialValues],
  );

  useEffect(() => {
    if (!savedAt) return;
    const timer = window.setTimeout(() => setSavedAt(null), 3750);
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  const update = useCallback(<K extends keyof SegmentValues>(key: K, value: SegmentValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const showError = (key: keyof SegmentValues) => (submitted || touched[key]) && errors[key];

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
    <form className="segment-preview" onSubmit={handleSubmit} noValidate>
      <h2>{title}</h2>
      <label htmlFor="segment-name">Name</label>
      <input id="segment-name" value={values.name} onChange={(e) => update("name", e.target.value)} />
      {showError("name") && <small role="alert">{errors.name}</small>}
      <label htmlFor="segment-email">Email</label>
      <input id="segment-email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
      {showError("email") && <small role="alert">{errors.email}</small>}
      <label htmlFor="segment-region">Region</label>
        <input id="segment-region" value={values.region} onChange={(e) => update("region", e.target.value)} />
      {showError("region") && <small role="alert">{errors.region}</small>}
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

export default SegmentPreview;
