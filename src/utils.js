export function matchRoute(path) {
  function parseSearch(str) {
    if (str == null || !str.length) return null;

    str = str[0] == '?' ? str.slice(1) : str;
    const tokens = str.split('&');

    return tokens.reduce((acc, t) => {
      const [key, value] = t.split('=');
      acc[key] = value === undefined ? true : value;
      return acc;
    }, {});
  }

  const r = new RegExp(`^${path}$`);
  if (r.test(window.location.pathname)) {
    return {
      path,
      search: parseSearch(window.location.search)
    };
  }

  return null;
}

export function formatNumber(n) {
  if (n >= 1000) {
    return `${Math.ceil(n / 1000)}K`;
  }
  return n;
}

export function range(a, b) {
  const result = Array(b - a);
  for (let i = 0; i < result.length; i++) {
    result[i] = a + i;
  }
  return result;
}

export function navTo(href) {
  document.location.href = href;
}

export function isFocused(el) {
  return el === document.activeElement;
}
