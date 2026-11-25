// This client is used only for GitHub metadata/reporting, never for crawled URLs.
export function githubClient({ token = process.env.GH_TOKEN, fetchImpl = fetch } = {}) {
  if (!token) throw new Error('GH_TOKEN is required for GitHub operations.');
  return {
    async request(method, path, body) {
      if (!path.startsWith('/repos/') || path.startsWith('//')) throw new Error('Invalid GitHub API path.');
      const response = await fetchImpl(`https://api.github.com${path}`, {
        method,
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
        redirect: 'error',
      });
      // Fail closed. In particular, don't retry an ambiguous issue-creation POST.
      if (!response.ok) throw new Error(`GitHub ${method} ${path} returned ${response.status}.`);
      return response.status === 204 ? null : response.json();
    },
  };
}

export async function paginate(client, path, key) {
  const rows = [];
  for (let page = 1; page <= 100; page++) {
    const data = await client.request('GET', `${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
    const batch = key ? data[key] : data;
    if (!Array.isArray(batch)) throw new Error(`Unexpected GitHub response for ${path}.`);
    rows.push(...batch);
    if (batch.length < 100) return rows;
  }
  throw new Error(`GitHub pagination limit reached for ${path}; refusing incomplete state.`);
}
