import botox_validatable_factory from "@/framework/validatable";
const btx_validatable = botox_validatable_factory();

@btx_validatable.from_parser(MyValidatable.parse)
class MyValidatable {

    static parse(encoded: unknown) {
        return new MyValidatable();
    }
}
