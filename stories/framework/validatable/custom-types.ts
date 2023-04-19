import botox_validatable_factory from "@/framework/validatable";
const btx_validatable = botox_validatable_factory();

//@ts-expect-error
@btx_validatable(() => null)
@btx_validatable(MyValidatable.parse)
class MyValidatable {

    static parse(encoded: unknown) {
        return new MyValidatable();
    }
}
