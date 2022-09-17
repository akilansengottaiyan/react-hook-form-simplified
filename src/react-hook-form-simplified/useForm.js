/* eslint-disable prettier/prettier */
import React from "react";
import { createFormControl } from "./createFormControl";
import { useSubscribe } from "./useSubscribe";
import getProxyFormState from "./logic/getProxyFormState";

export const useForm = (props) => {
  const _formControl = React.useRef()
  const [formState, updateFormState] = React.useState({
    isDirty: false,
    dirtyFields: {},
    isSubmitted: false,
    submitCount: 0,
    touchedFields: {},
    isSubmitting: false,
    isSubmitSuccessful: false
  });
  if (_formControl.current) {
    _formControl.current.control._options = props;
  } else {
    _formControl.current = {
      ...createFormControl(props),
      formState
    };
  }
  const control = _formControl.current.control;

  // whenever this callback executes, the component will be rerendered.
  // implies that whenever we need to rerender from the root, we just execute the callback (which is registered using useSubscribe, so that the functions across the codebase can have the formState updated or just rerender when required)
  const callback = React.useCallback(
    (value) => {
      control._formState = {
        ...control._formState,
        ...value
      };
      updateFormState({ ...control._formState });
    },
    [control]
  );
  useSubscribe({
    subject: control._subjects.state,
    callback
  });

  React.useEffect(() => {
    if (control._stateFlags.watch) {
      control._stateFlags.watch = false;
      control._subjects.state.next({});
    }
    control._removeUnmounted();
    // unregister fields that are unmounted based on shouldUnregister
  });
  _formControl.current.formState = getProxyFormState(
    formState,
    control._proxyFormState
    /* this is to track the formState fields that are subscribed based on which computations on unsubscribed fields are avoided.
       hence the doc mention to explicitly access the particular formstate field like
       eg : {isDirty} = useFormState(). will mark _proxyFormState.isDirty = true. Refer to rules section in https://react-hook-form.com/api/useform/formstate
    */
  );

  return _formControl.current;
};
