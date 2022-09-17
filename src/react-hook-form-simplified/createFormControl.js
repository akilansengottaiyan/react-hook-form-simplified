import {
  get,
  set,
  isNullOrUndefined,
  isEmptyObject,
  isUndefined,
  isHTMLElement,
  live,
  unset,
  deepEqual,
  cloneObject
} from "./utils";
import { EVENTS } from "./constants";
import isWatched from "./logic/isWatched";
import { createSubject } from "./createSubject";

export function createFormControl(props) {
  let _options = { ...props };
  // shouldUnregister makes sure that formValues contains only the values of mounted fields not just the copy of defaultvalues.
  let _formValues = _options.shouldUnregister
    ? {}
    : cloneObject(_options.defaultValues);

  let _defaultValues = cloneObject(_options.defaultValues) || {};
  let _formState = {
    isDirty: false,
    dirtyFields: {},
    isSubmitted: false,
    submitCount: 0,
    touchedFields: {},
    isSubmitting: false,
    isSubmitSuccessful: false
  };
  const _subjects = {
    watch: createSubject(), // list of subscriptions for useWatch. callback will be registered on the invoke of useWatch (not to be confused with watch api which uses different technique to rerender from the root)
    state: createSubject() // list of subscriptions for useForm & useFormState whenever formState is modified or we need to rerender from the root in case of watch() which just rerender from the root.
  };
  let _names = {
    mount: new Set(), // set of mounted fields, added once registered.
    unMount: new Set(), // set of fields to be unmounted. (used if shouldUnregister is true)
    watch: new Set(), // set of fields on which watch api is used upon (ie) watch(name)
    watchAll: false // boolean that denotes if all fields are watched. (ie) watch()
  };
  let _stateFlags = {
    mount: false, // will be set to true in useForm if the first render cycle is completed.
    watch: false
  };

  // this is to track the formState fields that are subscribed based on which computations on unsubscribed fields are avoided.
  // hence the doc mention to explicitly access the particular formstate field like
  // eg : {isDirty} = useFormState(). will mark _proxyFormState.isDirty = true. Refer to rules section in https://react-hook-form.com/api/useform/formstate
  const _proxyFormState = {
    isDirty: false,
    dirtyFields: false,
    touchedFields: false,
    isValidating: false,
    isValid: false,
    errors: false
  };
  let _fields = {};
  const onChange = (event) => {
    const target = event.target;
    const name = target.name;
    const field = get(_fields, name);
    const isBlurEvent =
      event.type === EVENTS.BLUR || event.type === EVENTS.FOCUS_OUT;
    const watched = isWatched(name, _names, isBlurEvent); // if watch() is added for this field
    const fieldValue = field._f.ref.value;
    set(_formValues, name, fieldValue);

    const fieldState = updateTouchAndDirty(
      name,
      fieldValue,
      isBlurEvent,
      false
    );
    const shouldRender = !isEmptyObject(fieldState) || watched;
    // _subjects.watch.next will trigger rerender if the useWatch is added for this field
    !isBlurEvent &&
      _subjects.watch.next({
        name,
        type: event.type
      });
    return (
      shouldRender &&
      // rerender useForm
      _subjects.state.next({ name, ...(watched ? {} : fieldState) })
    );
  };
  const register = (name) => {
    let field = get(_fields, name);
    set(_fields, name, {
      _f: {
        ...(field && field._f ? field._f : { ref: { name } }),
        name
      }
    });
    _names.mount.add(name);
    if (!field) updateValidAndValue(name, true);
    return {
      name,
      onChange,
      onBlur: onChange,
      ref: (ref) => {
        if (ref) {
          register(name);
          const field = get(_fields, name);
          const fieldRef = ref;
          if (fieldRef === field._f.ref) {
            return;
          }
          set(_fields, name, {
            _f: {
              ...field._f,
              ref: fieldRef
            }
          });
          updateValidAndValue(name, false, undefined, fieldRef);
        } else {
          // when the ref is null, it means the field is unmounted and not in the dom anymore.
          // if shouldUnregister : true, then we need to remove the value from _formValues as well or else, formValues will contain the values from unmounted fields as well.
          _options.shouldUnregister && _names.unMount.add(name);
        }
      }
    };
  };

  const unregister = (name) => {
    for (const fieldName of name ? [name] : _names.mount) {
      if (get(_fields, fieldName)) {
        unset(_fields, fieldName);
        unset(_formValues, fieldName);
        unset(_formState.dirtyFields, fieldName);
        unset(_formState.touchedFields, fieldName);
        !_options.shouldUnregister && unset(_defaultValues, fieldName);
      }
    }
    // _subjects.watch.next will trigger rerender if the useWatch is added for this field
    _subjects.watch.next({});
    // if the formState needs to be updated, trigger setState in useForm by invoking the callback subscribed to it.
    _subjects.state.next({
      ..._formState,
      ...(!options.keepDirty ? {} : { isDirty: _getDirty() })
    });
  };

  const watch = (name) => {
    if (name) {
      _names.watch.add(name);
      return get(_formValues, name);
    } else {
      _names.watchAll = true;
      return _formValues;
    }
  };
  const reset = (formValues) => {
    const updatedValues = formValues || _defaultValues;
    const cloneUpdatedValues = cloneObject(updatedValues);
    const values =
      formValues && !isEmptyObject(formValues)
        ? cloneUpdatedValues
        : _defaultValues;
    _defaultValues = updatedValues;
    _fields = {};
    _formValues = _options.shouldUnregister ? {} : cloneUpdatedValues;

    // it will trigger rerender if the useWatch is added for this field
    _subjects.watch.next({
      values
    });
    _names = {
      mount: new Set(), // track the fields once mounted.
      unMount: new Set(), // if the ref is null in register(), which means the dom element is unmounted and the field is added to this set which is removed on useEffect in useForm
      watch: new Set(), // watch(name) is called, then the name is added to the set.
      watchAll: false, // if watch() is called, then this is marked true
    };

    _stateFlags.watch = !!props.shouldUnregister;

    // rerender useForm with the formState reset to default
    _subjects.state.next({
      submitCount: 0,
      isDirty: false,
      isSubmitted: false,
      dirtyFields: {},
      touchedFields: {},
      errors: {},
      isSubmitting: false,
      isSubmitSuccessful: false
    });
  };
  const setValue = (name, value) => {
    const cloneValue = cloneObject(value);
    set(_formValues, name, cloneValue);
    setFieldValue(name, cloneValue); // put the value to the element using its ref
    // if watch is added for this field, just trigger dummy setState in useForm by invoking the callback subscribed to it with {}.
    isWatched(name, _names) && _subjects.state.next({});
    // _subjects.watch.next will trigger rerender if the useWatch is added for this field
    _subjects.watch.next({
      name
    });
  };
  const setFieldValue = (name, value) => {
    const field = get(_fields, name);
    let fieldValue = value;

    if (field) {
      const fieldReference = field._f;

      if (fieldReference) {
        !fieldReference.disabled && set(_formValues, name, value);

        fieldValue =
          isHTMLElement(fieldReference.ref) && isNullOrUndefined(value)
            ? ""
            : value;

        fieldReference.ref.value = fieldValue;
      }
    }
  };
  const _getDirty = (name, data) => (
    name && data && set(_formValues, name, data),
    !deepEqual(getValues(), _defaultValues)
  );
  /* since we do not have isValid in this codebase but react-hook-form uses this function to update value and isValid, we are using the same  without any logic relatd to isValid*/
  const updateValidAndValue = (name, shouldSkipSetValueAs, value, ref) => {
    const field = get(_fields, name);
    if (field) {
      const defaultValue = get(
        _formValues,
        name,
        isUndefined(value) ? get(_defaultValues, name) : value
      );
      isUndefined(defaultValue) || shouldSkipSetValueAs
        ? set(
          _formValues,
          name,
          shouldSkipSetValueAs ? defaultValue : field._f.ref.value
        )
        : setFieldValue(name, defaultValue);
    }
  };

  const updateTouchAndDirty = (
    name,
    fieldValue,
    isBlurEvent,
    shouldDirty,
    shouldRender
  ) => {
    let isFieldDirty = false;
    const output = {
      name
    };
    const isPreviousFieldTouched = get(_formState.touchedFields, name);

    if (_proxyFormState.isDirty) {
      const isPreviousFormDirty = _formState.isDirty;

      _formState.isDirty = output.isDirty = _getDirty();
      isFieldDirty = isPreviousFormDirty !== output.isDirty;
    }

    if (_proxyFormState.dirtyFields && (!isBlurEvent || shouldDirty)) {
      const isPreviousFieldDirty = get(_formState.dirtyFields, name);
      const isCurrentFieldPristine = deepEqual(
        get(_defaultValues, name),
        fieldValue
      );

      isCurrentFieldPristine
        ? unset(_formState.dirtyFields, name)
        : set(_formState.dirtyFields, name, true);
      output.dirtyFields = _formState.dirtyFields;
      isFieldDirty =
        isFieldDirty ||
        isPreviousFieldDirty !== get(_formState.dirtyFields, name);
    }

    if (isBlurEvent && !isPreviousFieldTouched) {
      set(_formState.touchedFields, name, isBlurEvent);
      output.touchedFields = _formState.touchedFields;
      isFieldDirty =
        isFieldDirty ||
        (_proxyFormState.touchedFields &&
          isPreviousFieldTouched !== isBlurEvent);
    }
    // if watch is added for this field or if the formState is needed to be updated, trigger setState in useForm by invoking the callback subscribed to it.
    isFieldDirty && shouldRender && _subjects.state.next(output);

    return isFieldDirty ? output : {};
  };
  const getValues = () => {
    return _formValues;
  };

  const handleSubmit = (onValid, onInvalid) => async (e) => {
    if (e) {
      e.preventDefault && e.preventDefault();
      e.persist && e.persist();
    }
    let hasNoPromiseError = true;
    let fieldValues = cloneObject(_formValues);
    // if the formState needs to be updated, trigger setState in useForm by invoking the callback subscribed to it.
    _subjects.state.next({
      isSubmitting: true
    });
    await onValid(fieldValues, e);

    _formState.isSubmitted = true;
    // if watch is added for this field or if the formState is needed to be updated, trigger setState in useForm by invoking the callback subscribed to it.
    _subjects.state.next({
      isSubmitted: true,
      isSubmitting: false,
      isSubmitSuccessful: hasNoPromiseError,
      submitCount: _formState.submitCount + 1
    });
  };

  const _removeUnmounted = () => {
    for (const name of _names.unMount) {
      const field = get(_fields, name);
      // need to unregister it if the field's element is not attached to the dom anymore which means its unmounted
      field && !live(field._f.ref) && unregister(name);
    }
    _names.unMount = new Set();
  };
  return {
    control: {
      register,
      unregister,
      _getDirty,
      _removeUnmounted,
      _subjects,
      _proxyFormState,
      _fields,
      _formValues,
      _stateFlags,
      _defaultValues,
      _names,
      _formState,
      get _options() {
        return _options;
      },
      set _options(value) {
        _options = {
          ..._options,
          ...value
        };
      }
    },
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    unregister
  };
}
