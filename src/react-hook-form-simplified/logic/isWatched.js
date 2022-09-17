export default (
  name,
  _names,
  isBlurEvent,
) =>
  !isBlurEvent &&
  (_names.watchAll ||
    _names.watch.has(name) ||
    [..._names.watch].some(
      (watchName) =>
        name.startsWith(watchName) &&
        /^\.\w+/.test(name.slice(watchName.length)),
    ));
