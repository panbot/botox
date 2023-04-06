import { FALSY, IS } from "@/lib/types";
import { assert_true } from "stories/asserts";

type VALIDATABLE_OPTIONS<T> = {
    parser: (input: unknown) => T;
    validator?: (parsed: T) => string | FALSY;
}

type BIND<F, T> = F extends (...args: infer U) => infer R
    ? (this: T, ...args: U) => R
    : F

type OPTIONS<T> = {
    validatable: VALIDATABLE_OPTIONS<T>,
}

function arg<T, P>(

) {
    return Object.assign((target: T, property: P) => {}, {

        parser: <V, T1, P1>(v: BIND<VALIDATABLE_OPTIONS<V>["parser"], T1>) => {
            return Object.assign((target: T1, property: P1) => {}, {
                validator<T2, P2>(v: BIND<VALIDATABLE_OPTIONS<V>["validator"], T2>) {

                    return (target: T2, property: P2) => {};
                }
            })
        },

        validatable: <V, T1, P1>(v: VALIDATABLE_OPTIONS<V> & ThisType<T1>) => {
            return (target: T1, property: P1) => {};
        }
    });
}

class MyService {

}

class MyApi {

    service: MyService;

    @arg(
    ).parser(function (v) {
        assert_true<IS<typeof this.service, MyService>>();
        return `${v}`
    })
    arg1: string;

    @arg(
    ).parser(
        v => `${v}`
    ).validator(function (v) {
        assert_true<IS<typeof v, string>>();
        return v.startsWith(this.arg1) ? undefined : 'error'
    })
    arg1_and_some: string;

    @arg(
    ).validatable({
        parser: v => `${v}`,
        validator(v) {
            assert_true<IS<typeof v, string>>();

            return v.startsWith(this.arg1_and_some) ? undefined : 'error'
        }
    })
    arg1_and_some_and_some: string;
}
