import { createHash, timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';

const digest = (s: string) => createHash('sha256').update(s).digest();

/** The browser's own login box (HTTP Basic). Any user name works; only the password counts. */
export function passwordRequired(password: string): RequestHandler {
  const expected = digest(password);
  return (req, res, next) => {
    const [scheme, encoded] = (req.headers.authorization ?? '').split(' ');
    if (scheme === 'Basic' && encoded) {
      const decoded = Buffer.from(encoded, 'base64').toString('utf8');
      if (timingSafeEqual(digest(decoded.slice(decoded.indexOf(':') + 1)), expected)) {
        next();
        return;
      }
    }
    res.set('WWW-Authenticate', 'Basic realm="Rekendashboard", charset="UTF-8"').status(401).send('Wachtwoord nodig');
  };
}

/** The header the dashboard sends with every change. */
export const CHANGE_HEADER = 'x-rekenen-dashboard';

/**
 * Changes only come from the dashboard itself. The browser sends the password along with requests from
 * any site, but another site can't add this header without asking first (a CORS preflight), which this
 * server never allows. Unlike comparing Origin with Host, this also works behind a proxy.
 */
export const fromDashboard: RequestHandler = (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.headers[CHANGE_HEADER] !== '1') {
    res.status(403).json({ error: `changes need the ${CHANGE_HEADER} header` });
    return;
  }
  next();
};
