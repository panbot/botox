import botox_validatable_factory from "@/validatable";
const btx_validatable = botox_validatable_factory();

//@ts-expect-error
@btx_validatable(() => undefined)
//@ts-expect-error
@btx_validatable(() => ({}))
//@ts-expect-error
@btx_validatable(() => {})
@btx_validatable(MyValidatable.parse)
class MyValidatable {

    private data: any;

    static parse(encoded: unknown) {
        return new MyValidatable();
    }
}

btx_validatable.set_options(MyValidatable, MyValidatable.parse);
//@ts-expect-error
btx_validatable.set_options(MyValidatable, () => null);
//@ts-expect-error
btx_validatable.set_options(MyValidatable, () => {});
//@ts-expect-error
btx_validatable.set_options(MyValidatable, () => ({}));
