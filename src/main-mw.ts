import bodyParser from '@curveball/bodyparser';
import browser from '@curveball/browser';
import cors from '@curveball/cors';
import links from '@curveball/links';
import problem from '@curveball/problem';
import session from '@curveball/session';
import validator from '@curveball/validator';
import { RedisStore } from '@curveball/session-redis';
import { invokeMiddlewares, Middleware } from '@curveball/core';

import login from './middleware/login.js';
import csrf from './middleware/csrf.js';
import routes from './routes.js';
import { getSetting } from './server-settings.js';
import { join } from 'path';

/**
 * The 'main middleware'.
 *
 * Most of the application is expressed as a single middleware. This could
 * potentially allow a12nserver to be embedded in another curveball
 * application.
 */
export default function (): Middleware {

  if (process.env.PUBLIC_URI === undefined) {
    throw new Error('PUBLIC_URI environment variable must be set.');
  }

  const middlewares: Middleware[] = [];

  const corsAllowOrigin = getSetting('cors.allowOrigin');

  if (corsAllowOrigin) {
    middlewares.push(cors({
      allowOrigin: corsAllowOrigin
    }));
  }

  middlewares.push(
    session({
      store: process.env.REDIS_HOST ? new RedisStore({
        prefix: 'A12N-session',
        clientOptions: {
          url: process.env.REDIS_URI!,
        },
      }) : 'memory',
      cookieName: 'A12N',
      expiry: 60 * 60 * 24 * 7,
    }),
    browser({
      title: 'a12n-server',
      stylesheets: [
        '/assets/extra.css'
      ],
    }),
    problem(),

    login(),
    bodyParser(),
    csrf(),
    links(),
    validator({
      schemaPath: join(__dirname, '../schemas'),
      noLink: true,
    }),
    ...routes,
  );

  /**
   * This middleware contains all the a12n-server functionality.
   */
  return (ctx, next) => {
    return invokeMiddlewares(ctx, [...middlewares, next]);
  };

}
