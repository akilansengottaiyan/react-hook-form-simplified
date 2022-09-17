import "./styles.css";
import { useForm, useWatch } from "./react-hook-form-simplified";
import { useEffect, useState } from "react";
// import { useWatch } from "react-hook-form";
export default function App() {
  const {
    formState: {
      isDirty,
      dirtyFields,
      isSubmitted,
      submitCount,
      touchedFields,
      isSubmitting,
      isSubmitSuccessful
    },
    ...form
  } = useForm({
    defaultValues: {}
    // shouldUnregister: true
  });
  // const value = useWatch({ name: "field1", control: form.control });
  const values = form.watch();
  const [show, setShow] = useState(true);
  useEffect(() => {
    setTimeout(() => {
      form.reset({
        field1: "Resetted value.....",
        field2: "Field2 default Value..."
      });
    }, 3 * 1000);
  }, []);
  return (
    <div className="App">
      <form
        onSubmit={form.handleSubmit((data) => console.log("Data is...", data))}
      >
        <h1>Hello CodeSandbox</h1>
        {show && <input {...form.register("field1")} />}
        <button>Submit </button>
      </form>
      <button type="button" onClick={() => console.log(form.getValues())}>
        Get values{" "}
      </button>
      <button
        type="button"
        onClick={() => form.setValue("field1", "setValued input")}
      >
        Set value{" "}
      </button>
      <button type="button" onClick={() => form.unregister("field1")}>
        Unregister
      </button>
      <button
        type="button"
        onClick={() => {
          setShow(!show);
        }}
      >
        Show/Hide
      </button>
    </div>
  );
}
