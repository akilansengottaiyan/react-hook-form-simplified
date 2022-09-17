import React from "react";
import { get } from "./utils";
import { useSubscribe } from "./useSubscribe";
export const useWatch = ({ name, control, defaultValue }) => {
  const [value, updateValue] = React.useState(defaultValue);
  const callback = React.useCallback(
    (formState) => {
      const newValue = get(formState.values || control._formValues, name);
      updateValue(newValue);
    },
    [control, defaultValue]
  );
  React.useEffect(() => {
    control._removeUnmounted();
  });
  useSubscribe({
    subject: control._subjects.watch,
    callback
  });
  return value;
};
