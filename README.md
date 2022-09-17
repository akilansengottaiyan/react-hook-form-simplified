
This code is the simplified version of the [``react-hook-form@7.34.2``](https://github.com/react-hook-form/react-hook-form)

[react-hook-form-simplified in CodeSandbox](https://codesandbox.io/s/react-hook-form-simplified-xwhrlr)

### ⚠️ Do not use in production ⚠️
<br/>

### Caveats : 

 - Implements only ``useForm`` and ``useWatch`` apis.
 - All options to the above apis other than ``shouldUnregister`` is considered default.
 - Works only for ``input[type="text"]``
 - Validation logics are skipped for simplicity. Hence ``formstate`` won't contain the below fields.
    - ``isValid``
    - ``isValidating``
    - ``errors`` 
 - Do not have implementations for 
    - useFieldArray
    - useController
    - useFormState 

<br/>

### Overview : 

Ever wondered how react-hook-form(RHF) achieves great performance?
Jump in to learn more.

Filenames and functions names are used as it is to facilitate easy understanding of original library code.
<br/>
<br/>
### Technical overview
RHF leverages closures very well. (ie) instead of setState, every onchange will update the formValues variable in its enclosing functional scope.

Has only ``formState`` as a state in the useForm root which means only the formState update will rerender the form while changes in formValues wont.

Uses Proxy pattern to memoize the subscribed fields of formstate and use the same to avoid unnecessary computations.

Uses subscription based interface to add, remove and call the setStates.
<br/>
<br/>

### Why only ``shouldUnregister`` is taken into account?

    shouldUnregister is a bit tricky option than other options since it influences the formvalues in many ways

### Tricky scenarios

#### Watch and useWatch : 
If shouldUnregister : true, and if we only render certain component that uses useWatch based on resetted field value, we got a tricky situation here. 
shouldUnregister will make sure that formValues will only contain

Both are same, given that the defaultValue is not passed to both the apis.
If the defaultValue is passed and the passed defaultValue to the api is not the same as one from defaultValues passed to useForm, it get stored to the useWatch state which won’t be updated unless setState which gets triggered only when reset or onChange occurs and hence even though formValues gets updated once the register happens (in case of shouldUnregister:true) with the defaultValues from useForm, this won’t trigger the rerender. So always make sure the defaultValue passed to useWatch is same as defaultValue passed to useForm.
In case of watch, given that it gets the value on demand from formValues once the component is mounted, it always returns value which is in sync with formValues.

#### useWatch and reset : 
As mentioned in the doc, useWatch needs to be placed (which will add a listener) before the reset takes place or any onchange event.
But what if we could only mount the component which contains useWatch based on value from reset api?
useWatch wont gets triggered because, if you mount useWatch based on value from reset api, then reset action is done even before there is a listener to act on it. 
We could have to set the mount useForm with values from async call as the default Values instead of calling reset api.




