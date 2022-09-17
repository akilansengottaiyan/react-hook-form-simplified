export const compact = (value) =>
  Array.isArray(value) ? value.filter(Boolean) : [];
export const isNullOrUndefined = (value) => value == null;

export const isUndefined = (value) => value === undefined;

export const isObject = (value) =>
  !isNullOrUndefined(value) &&
  !Array.isArray(value) &&
  typeof value === "object" &&
  !(value instanceof Date);

export const stringToPath = (input) =>
  compact(input.replace(/["|']|\]/g, "").split(/\.|\[/));

export const isKey = (value) => /^\w*$/.test(value);

export const get = (obj, path, defaultValue) => {
  if (!path || !isObject(obj)) {
    return defaultValue;
  }
  const result = compact(path.split(/[,[\].]+?/)).reduce(
    (result, key) => (isNullOrUndefined(result) ? result : result[key]),
    obj
  );
  return isUndefined(result) || result === obj
    ? isUndefined(obj[path])
      ? defaultValue
      : obj[path]
    : result;
};

export const set = (object, path, value) => {
  let index = -1;
  const tempPath = isKey(path) ? [path] : stringToPath(path);
  const length = tempPath.length;
  const lastIndex = length - 1;

  while (++index < length) {
    const key = tempPath[index];
    let newValue = value;

    if (index !== lastIndex) {
      const objValue = object[key];
      newValue =
        isObject(objValue) || Array.isArray(objValue)
          ? objValue
          : !isNaN(+tempPath[index + 1])
          ? []
          : {};
    }
    object[key] = newValue;
    object = object[key];
  }
  return object;
};

export const isHTMLElement = (value) => {
  const owner = value ? value.ownerDocument : 0;
  const ElementClass =
    owner && owner.defaultView ? owner.defaultView.HTMLElement : HTMLElement;
  return value instanceof ElementClass;
};

export const isEmptyArray = (obj) => {
  for (const key in obj) {
    if (!isUndefined(obj[key])) {
      return false;
    }
  }
  return true;
};

export const isEmptyObject = (value) =>
  isObject(value) && !Object.keys(value).length;

export const unset = (object, path) => {
  const updatePath = isKey(path) ? [path] : stringToPath(path);
  const childObject =
    updatePath.length == 1 ? object : baseGet(object, updatePath);
  const key = updatePath[updatePath.length - 1];
  let previousObjRef;
  if (childObject) {
    delete childObject[key];
  }
  for (let k = 0; k < updatePath.slice(0, -1).length; k++) {
    let index = -1;
    let objectRef;
    const currentPaths = updatePath.slice(0, -(k + 1));
    const currentPathsLength = currentPaths.length - 1;
    if (k > 0) {
      previousObjRef = object;
    }
    while (++index < currentPaths.length) {
      const item = currentPaths[index];
      objectRef = objectRef ? objectRef[item] : object[item];
      if (
        currentPathsLength === index &&
        ((isObject(objectRef) && isEmptyObject(objectRef)) ||
          (Array.isArray(objectRef) && isEmptyArray(objectRef)))
      ) {
        previousObjRef ? delete previousObjRef[item] : delete object[item];
      }

      previousObjRef = objectRef;
    }
  }
  return object;
};

export const isObjectType = (value) => typeof value === "object";
export const isPrimitive = (value) =>
  isNullOrUndefined(value) || !isObjectType(value);

export const deepEqual = (object1, object2) => {
  if (isPrimitive(object1) || isPrimitive(object2)) {
    return object1 === object2;
  }

  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    const val1 = object1[key];

    if (!keys2.includes(key)) {
      return false;
    }

    if (key !== "ref") {
      const val2 = object2[key];

      if (
        (isObject(val1) && isObject(val2)) ||
        (Array.isArray(val1) && Array.isArray(val2))
          ? !deepEqual(val1, val2)
          : val1 !== val2
      ) {
        return false;
      }
    }
  }

  return true;
};

export const live = (ref) => isHTMLElement(ref) && ref.isConnected;

export const cloneObject = (data) => {
  let copy;
  const isArray = Array.isArray(data);

  if (data instanceof Date) {
    copy = new Date(data);
  } else if (data instanceof Set) {
    copy = new Set(data);
  } else if (
    !(data instanceof Blob || data instanceof FileList) &&
    (isArray || isObject(data))
  ) {
    copy = isArray ? [] : {};
    for (const key in data) {
      if (typeof data[key] === "function") {
        copy = data;
        break;
      }
      copy[key] = cloneObject(data[key]);
    }
  } else {
    return data;
  }

  return copy;
};
