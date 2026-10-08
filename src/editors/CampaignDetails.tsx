import { useCallback, useEffect, useMemo, useState } from "react";

export interface CampaignValues {
  name: string;
  email: string;
  enabled: boolean;
  quantity: number;
}

export type CampaignErrors = Partial<Record<keyof CampaignValues, string>>;

export interface CampaignDetailsProps {
  title?: string;
  initialValues?: Partial<CampaignValues>;
  onSubmit?: (values: CampaignValues) => void;
  onCancel?: () => void;
}

const DEFAULTS: CampaignValues = {
  name: "",
  email: "",
  enabled: true,
  quantity: 0,
};
const EMAIL_PATTERN = /^[^s@]+@[^s@]+.[^s@]+$/;

export function validateCampaign(values: CampaignValues): CampaignErrors {
  const errors: CampaignErrors = {};
  if (values.name.trim().length < 2) errors.name = "name must be at least 2 characters";
  if (!EMAIL_PATTERN.test(values.email)) errors.email = "email is not valid";
  if (values.quantity < 0 || values.quantity > 38) errors.quantity = "quantity must be between 0 and 38";
  return errors;
}

export function CampaignDetails({ title = "Campaign Details", initialValues, onSubmit, onCancel }: CampaignDetailsProps) {
  const [values, setValues] = useState<CampaignValues>({ ...DEFAULTS, ...initialValues });
  const [touched, setTouched] = useState<Partial<Record<keyof CampaignValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const errors = useMemo(() => validateCampaign(values), [values]);
  const isValid = Object.keys(errors).length === 0;
  const isDirty = useMemo(
    () => (Object.keys(DEFAULTS) as (keyof CampaignValues)[]).some((k) => values[k] !== { ...DEFAULTS, ...initialValues }[k]),
    [values, initialValues],
  );

  useEffect(() => {
    if (!savedAt) return;
    const timer = window.setTimeout(() => setSavedAt(null), 3500);
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  const update = useCallback(<K extends keyof CampaignValues>(key: K, value: CampaignValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const showError = (key: keyof CampaignValues) => (submitted || touched[key]) && errors[key];

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
    <form className="campaign-details" onSubmit={handleSubmit} noValidate>
      <h2>{title}</h2>
      <label htmlFor="campaign-name">Name</label>
      <input id="campaign-name" value={values.name} onChange={(e) => update("name", e.target.value)} />
      {showError("name") && <small role="alert">{errors.name}</small>}
      <label htmlFor="campaign-email">Email</label>
      <input id="campaign-email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
      {showError("email") && <small role="alert">{errors.email}</small>}
      <label htmlFor="campaign-quantity">Quantity</label>
        <input id="campaign-quantity" type="number" value={values.quantity} onChange={(e) => update("quantity", Number(e.target.value))} />
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

export default CampaignDetails;
