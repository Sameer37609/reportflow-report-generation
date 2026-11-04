import type { NextConfig } from 'next';
import { applicationMode } from './lib/mode';
applicationMode();
const config: NextConfig = { poweredByHeader: false };
export default config;
