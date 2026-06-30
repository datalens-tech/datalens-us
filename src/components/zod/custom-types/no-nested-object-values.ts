export const noNestedObjectValues = (obj: Record<string, unknown>) =>
    Object.values(obj).every((v) => v === null || typeof v !== 'object' || Array.isArray(v));
