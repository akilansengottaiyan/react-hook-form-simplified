import "./styles.css";
import { useForm, useWatch } from "./react-hook-form-simplified";
import { useEffect, useState } from "react";
export default function App() {
  const
    form = useForm({
      defaultValues: {},
      shouldUnregister: true
    });
  const [show, setShow] = useState(true);
  const latestField1Value = useWatch({
    name: 'field1',
    control: form.control
  })
  useEffect(() => {
    setTimeout(() => {
      form.reset({
        field1: "value1"
      });
    }, 3 * 1000);
  }, []);
  console.log("useWatch output...", latestField1Value)
  return (
    <div className="App">
      <form
        onSubmit={form.handleSubmit((data) => console.log("Submitted formdata is.", data))}
      >
        {show && <input {...form.register("field1")} />}
        <button>Submit </button>
      </form>
      <div className="actions">
        <button type="button" onClick={() => console.log(form.getValues())}>
          Get values{" "}
        </button>
        <button
          type="button"
          onClick={() => form.setValue("field1", "setValue 1")}
        >
          Set value{" "}
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
    </div>
  );
}
