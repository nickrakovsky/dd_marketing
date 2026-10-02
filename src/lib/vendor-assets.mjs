// Public site identifier. A different Bento site requires reviewing new pins.
export const PINNED_BENTO_UUID = 'b4cb9a34a989bcc643714151df7b7154';

// Reviewed October 1, 2026. Mutable vendor URLs must match these exact bytes
// before they can be published as first-party assets. Never auto-update pins.
export const VENDOR_SOURCES = {
  calendlyJs: {
    url: 'https://assets.calendly.com/assets/external/widget.js',
    integrity: 'sha384-awkjqjft67LVVNwOWu0qZqx+dlqVH579sQCuh4s2MWJ+CG1/ibi/ithni5O6Xoxb',
    extension: 'js',
  },
  calendlyCss: {
    url: 'https://assets.calendly.com/assets/external/widget.css',
    integrity: 'sha384-67uIdVe4m4TxxjpfwKVZM7pU9wV+C8zVGqwoIeqLy3XlM72ibZRsmeq4FEvaFTdp',
    extension: 'css',
  },
  calendlyCloseIcon: {
    url: 'https://assets.calendly.com/assets/external/close-icon.svg',
    integrity: 'sha384-H8umMUxydhvKKYYsA4a0Vgv9YGoWxRZYQY7Qihi8SQS1snvFTVKyLQ5C4kYgg/Rv',
    extension: 'svg',
  },
  dealfront: {
    url: 'https://sc.lfeeder.com/lftracker_v1_3P1w24d9vEoamY5n.js',
    integrity: 'sha384-/v0tGOWWqw5YY6BHWIep+y1E3FUIyQlsIHPycoC4tazQlNZnw9WABlaGiobscidO',
    extension: 'js',
  },
  bentoBootstrap: {
    url: `https://fast.bentonow.com?site_uuid=${PINNED_BENTO_UUID}`,
    integrity: 'sha384-5ElqxqJnGcqdrd+glnoCc1ubTBNLjNL2WlCuiuz6oB1hL1s1OCFYcL//K2GiaIpU',
    extension: 'js',
  },
  bentoSdk: {
    url: `https://app.bentonow.com/${PINNED_BENTO_UUID}.js`,
    integrity: 'sha384-wXML0YNxxUzw4ZMCNPmYMgFKJwZWr4rw8/XxyI56JGDzr5oC+To3I0lc3qRqEgJ1',
    extension: 'js',
    // Bento rejects GitHub-hosted build runners with HTTP 403. Publish the
    // reviewed snapshot, checking the same pin before every build.
    snapshot: 'src/assets/vendor/bento-sdk.js',
  },
};

const token = integrity => integrity.slice(7, 23).replaceAll('+', '-').replaceAll('/', '_');
const pathFor = (name, dependency) => {
  const source = VENDOR_SOURCES[name];
  const suffix = dependency ? `.${token(VENDOR_SOURCES[dependency].integrity)}` : '';
  return `/_astro/vendor/${name}.${token(source.integrity)}${suffix}.${source.extension}`;
};

// Paths of transformed assets include their dependency's digest as well.
export const VENDOR_ASSETS = {
  calendlyJs: { path: pathFor('calendlyJs'), integrity: VENDOR_SOURCES.calendlyJs.integrity },
  calendlyCss: { path: pathFor('calendlyCss', 'calendlyCloseIcon') },
  calendlyCloseIcon: { path: pathFor('calendlyCloseIcon') },
  dealfront: { path: pathFor('dealfront'), integrity: VENDOR_SOURCES.dealfront.integrity },
  bentoBootstrap: { path: pathFor('bentoBootstrap', 'bentoSdk') },
  bentoSdk: { path: pathFor('bentoSdk') },
};

export function bentoScriptPath(uuid) {
  if (!uuid) return undefined;
  if (uuid !== PINNED_BENTO_UUID) {
    throw new Error('PUBLIC_BENTO_SITE_UUID does not match the reviewed vendor assets. Review and update the Bento pins before deploying.');
  }
  return VENDOR_ASSETS.bentoBootstrap.path;
}
