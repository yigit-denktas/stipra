// Stiprā's static prefix on a hostname shared with other applications.
export async function serve(request, upstreamFetch = fetch) {
  const url = new URL(request.url);
  if (url.hostname !== 'apps.yigitdenktas.com' ||
      !(url.pathname === '/stipra' || url.pathname.startsWith('/stipra/'))) {
    return new Response('Not found', {status: 404});
  }
  if (!['GET', 'HEAD'].includes(request.method)) {
    return new Response('Method not allowed', {status: 405, headers: {Allow: 'GET, HEAD'}});
  }
  if (url.pathname === '/stipra') {
    url.pathname = '/stipra/';
    return Response.redirect(url.href, 308);
  }
  const origin = url.origin;
  url.protocol = 'https:';
  url.hostname = 'yigitdenktas-apps.pages.dev';
  url.port = '';
  const headers = new Headers();
  for (const name of ['accept', 'accept-encoding', 'if-none-match', 'if-modified-since', 'range']) {
    if (request.headers.has(name)) headers.set(name, request.headers.get(name));
  }
  try {
    const response = await upstreamFetch(url.href, {method: request.method, headers, redirect: 'manual'});
    const result = new Response(response.body, response);
    const location = result.headers.get('location');
    if (location) {
      const destination = new URL(location, url);
      if (destination.origin === url.origin) {
        result.headers.set('location', origin + destination.pathname + destination.search + destination.hash);
      }
    }
    result.headers.set('x-stipra-route', 'pages-prefix-v1');
    return result;
  } catch {
    return new Response('Stiprā is temporarily unavailable. Mirror: https://yigit-denktas.github.io/stipra/',
      {status: 502, headers: {'content-type': 'text/plain; charset=utf-8'}});
  }
}
export default {fetch(request) { return serve(request); }};
