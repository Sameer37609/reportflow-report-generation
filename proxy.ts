import { NextResponse, type NextRequest } from 'next/server';
import { applicationMode } from './lib/mode';
export function proxy(request: NextRequest) {
  try {
    const mode = applicationMode();
    if (mode === 'demo' && !['GET', 'HEAD', 'OPTIONS'].includes(request.method))
      return NextResponse.json(
        { error: 'Public demo is read-only.' },
        { status: 403 },
      );
    return NextResponse.next();
  } catch {
    return NextResponse.json(
      { error: 'Application mode is not configured safely.' },
      { status: 503 },
    );
  }
}
export const config = {
  matcher: ['/((?!_next/static|_next/image|icon.svg|favicon.ico).*)'],
};
