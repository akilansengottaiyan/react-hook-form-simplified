export default (formState, _proxyFormState, localProxyFormState) => {
  const result = {} as typeof formState;
  for (const key in formState) {
    Object.defineProperty(result, key, {
      get: () => {
        const _key = key;
        _proxyFormState[_key] = true;
        localProxyFormState && (localProxyFormState[_key] = true);
        return formState[_key];
      },
    });
  }

  return result;
};
