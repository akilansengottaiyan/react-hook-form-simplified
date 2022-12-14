
This code is the simplified version of [``react-hook-form@7.34.2``](https://github.com/react-hook-form/react-hook-form). The code is intended only for the demonstration purposes.

[react-hook-form-simplified in CodeSandbox](https://codesandbox.io/p/github/akilansengottaiyan/react-hook-form-simplified/git/master?file=%2Fsrc%2FApp.js&selection=%5B%7B%22endColumn%22%3A10%2C%22endLineNumber%22%3A9%2C%22startColumn%22%3A10%2C%22startLineNumber%22%3A9%7D%5D)

### ⚠️ Do not use in production ⚠️

### Caveats : 
 - Implements only ``useForm`` and ``useWatch`` hooks.
 - All options to the above apis other than ``shouldUnregister`` are considered default.
 - Works only for ``input[type="text"]``
 - Validation logics are skipped for simplicity. Hence ``formstate`` won't contain the below fields.
    - ``isValid``
    - ``isValidating``
    - ``errors`` 

### Overview : 
Filenames and functions names from **react-hook-form** are used as it is to facilitate easy understanding of original source code.
<br/>
### Technical overview
RHF leverages closures very well. Instead of setState, every change api (onChange/setValue/reset) updates the formValues variable in its enclosing function scope.

``formState`` is the only state in the useForm root which means only the formState update will rerender the form while changes in formValues won't.

Uses Proxy pattern to memoize the subscribed fields of formstate and use the same to avoid unnecessary computations.

Uses subscription based interface to add, remove and call the setStates.
<br/>

### Why only ``shouldUnregister`` is taken into account?

    shouldUnregister is quite tricky and impacts many other apis.

### Notes:

#### Watch and useWatch
If shouldUnregister : true, and if we only render certain component that uses useWatch based on resetted field value, we got a tricky situation here. 
shouldUnregister will make sure that formValues will only contain

Both are the same, given that the defaultValue is not passed to both the apis.
If the defaultValue is passed and the passed defaultValue to the api is not the same as one from defaultValues passed to useForm, it get stored to the useWatch state which won’t be updated unless setState which gets triggered only when reset or onChange occurs and hence even though formValues gets updated once the register happens (in case of shouldUnregister:true) with the defaultValues from useForm, this won’t trigger the rerender. So always make sure the defaultValue passed to useWatch is the same as defaultValue passed to useForm.
In case of watch, given that it gets the value on demand from formValues once the component is mounted, it always returns value which is in sync with formValues.

#### useWatch and reset
As mentioned in the doc, useWatch needs to be placed (which will add a listener) before the reset takes place or any onchange event.
But what if we could only mount the component which contains useWatch based on value from reset api?
useWatch wont get triggered because, if you mount useWatch based on value from reset api, then reset action is done even before there is a listener to act on it. 
We could have to set the mount useForm with values from async call as the default Values instead of calling reset api.




