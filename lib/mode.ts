export type ApplicationMode = 'local' | 'demo';
export function applicationMode(): ApplicationMode {
  const value = process.env.REPORTFLOW_MODE;
  if (value !== 'local' && value !== 'demo')
    throw new Error('REPORTFLOW_MODE must explicitly be local or demo.');
  if (value === 'local' && process.env.VERCEL)
    throw new Error('Hosted deployments must use demo mode.');
  return value;
}
export function requireLocalWrites() {
  if (applicationMode() !== 'local')
    throw new Error('Public demo is read-only.');
}
