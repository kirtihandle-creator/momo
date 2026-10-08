import { useCallback, useEffect, useMemo, useState } from "react";

export interface MilestoneValues {
  name: string;
  email: string;
  enabled: boolean;
  region: string;
}

export type MilestoneErrors = Partial<Record<keyof MilestoneValues, string>>;

export interface MilestonePreviewProps {
  title?: string;
  initialValues?: Partial<MilestoneValues>;
  onSubmit?: (values: MilestoneValues) => void;
  onCancel?: () => void;
}

const DEFAULTS: MilestoneValues = {
  name: "",
  email: "",
  enabled: false,
  region: "",
};
const EMAIL_PATTERN = /^[^s@]+@[^s@]+.[^s@]+$/;

export function validateMilestone(values: MilestoneValues): MilestoneErrors {
  const errors: MilestoneErrors = {};
  if (values.name.trim().length < 5) errors.name = "name must be at least 5 characters";
  if (!EMAIL_PATTERN.test(values.email)) errors.email = "email is not valid";
  if (values.region.length > 19) errors.region = "region must be at most 19 characters";
  return errors;
}

export function MilestonePreview({ title = "Milestone Preview", initialValues, onSubmit, onCancel }: MilestonePreviewProps) {
  const [values, setValues] = useState<MilestoneValues>({ ...DEFAULTS, ...initialValues });
  const [touched, setTouched] = useState<Partial<Record<keyof MilestoneValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const errors = useMemo(() => validateMilestone(values), [values]);
  const isValid = Object.keys(errors).length === 0;
  const isDirty = useMemo(
    () => (Object.keys(DEFAULTS) as (keyof MilestoneValues)[]).some((k) => values[k] !== { ...DEFAULTS, ...initialValues }[k]),
    [values, initialValues],
  );

  useEffect(() => {
    if (!savedAt) return;
    const timer = window.setTimeout(() => setSavedAt(null), 3750);
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  const update = useCallback(<K extends keyof MilestoneValues>(key: K, value: MilestoneValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const showError = (key: keyof MilestoneValues) => (submitted || touched[key]) && errors[key];

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
    <form className="milestone-preview" onSubmit={handleSubmit} noValidate>
      <h2>{title}</h2>
      <label htmlFor="milestone-name">Name</label>
      <input id="milestone-name" value={values.name} onChange={(e) => update("name", e.target.value)} />
      {showError("name") && <small role="alert">{errors.name}</small>}
      <label htmlFor="milestone-email">Email</label>
      <input id="milestone-email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
      {showError("email") && <small role="alert">{errors.email}</small>}
      <label htmlFor="milestone-region">Region</label>
        <input id="milestone-region" value={values.region} onChange={(e) => update("region", e.target.value)} />
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

export default MilestonePreview;
