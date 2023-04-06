import expandify from "@/lib/expandify";
import { CONSTRUCTOR, FALSY, IS } from "@/lib/types";
import { assert_type } from "stories/asserts";

type OPTIONS<T> = {
    parser: (input: unknown) => T;
    validator?: (parsed: T) => string | FALSY;
}

function validatable<T>(
    options: OPTIONS<T> | OPTIONS<T>["parser"]
) {

    const decorator = function (
        target: CONSTRUCTOR<T>
    ) {

    };

    type DECORATOR = typeof decorator & {
        [ K in keyof Required<OPTIONS<T>> ]: (value: NonNullable<OPTIONS<T>[K]>) => DECORATOR
    }

    return decorator as DECORATOR
}

@validatable(
    MyType.parse
)
class MyType {

    static parse(input: unknown) {
        return new MyType
    }
}

validatable({
    parser: Number,
    validator(parsed) {
        assert_type<IS<typeof parsed, number>>();
        return isNaN(parsed)
            ? 'not a number'
            : undefined
    }
})(Number as any)

validatable(
    Number
).validator(
    parsed => {
        assert_type<IS<typeof parsed, number>>();
        return isNaN(parsed)
            ? 'not a number'
            : undefined
    }
)(Number as any)

validatable(
    Number
).validator(
    parsed => {
        assert_type<IS<typeof parsed, number>>();
        return isNaN(parsed)
            ? 'not a number'
            : undefined
    }
).validator(
    parsed => {
        assert_type<IS<typeof parsed, number>>();
        return isNaN(parsed)
            ? 'not a number'
            : undefined
    }
)(Number as any)

validatable(String)(String as any)
validatable(Boolean)(Boolean as any)

validatable(
    input => new Map<any, any>(),
)(Map)
