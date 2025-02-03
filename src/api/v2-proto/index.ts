import { glob } from 'glob';

export type Glob_Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function parseFilePath(filePath: string): Promise<{ method: Glob_Method, endpoint: string, manifest: string, handler: unknown; middleware: unknown[] }> {
  // filePath is like "earnest/personal-loans/GET.js"
  const parts = filePath.split('/'); // -> ["earnest", "personal-loans", "GET.js"]
  const methodWithExtension = parts.pop(); // -> "GET.js"
  const method = methodWithExtension?.split('.')[0] as Glob_Method || "GET"; // -> "GET"
  const endpoint = `/${parts.join('/')}/:id?`; // -> "/earnest/personal-loans/:id?"
  const loadedModule = await import(`./endpoints/${filePath}`); // Dynamic import -> { default: { handler, middleware } }

  return {
    method,
    endpoint,
    manifest: parts.join('/'),
    handler: loadedModule.default.handler,
    middleware: loadedModule.default.middleware
  };
}

export const getEndpointsFromGlob = async (): Promise<Array<{method: Glob_Method, endpoint: string, manifest: string; handler: unknown; middleware: unknown[]}>> => {
  const globSearch = await glob('**/{GET,POST,PUT,PATCH,DELETE}.{ts,js}', { cwd: 'dist/api/v2-proto/endpoints' }); // -> ["earnest/personal-loans/GET.js", ...]

  if (globSearch.length > 0) {
    const endpoints = globSearch.map(async function (file) {
      const endpoint = await parseFilePath(file);
      return endpoint;
    });
    return Promise.all(endpoints)
  }
  return [];
}