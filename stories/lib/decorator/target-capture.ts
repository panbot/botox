import { IS } from "@/lib/types";
import { assert_true } from "stories/asserts";
import "reflect-metadata";

function d1<T, K extends PropertyKey>(
    cb: (target: T, property: K) => void,
) {
    return function (target: T, property: K) {}
}

function d2<T, K extends PropertyKey>(options: {
    cb: () => void,
} & ThisType<T>) {
    return function (target: T, property: K) {}
}

function d3<T, K extends PropertyKey>(
    cb: (this: { target: T }) => void,
) {
    return function (target: T, property: K) {}
}

class A {

    @d1((t, p) => {
        assert_true<IS<typeof t, A>>();
        assert_true<IS<typeof p, "p">>();
    })
    @d2({ cb() {
        assert_true<IS<typeof this.p, string>>();
    } })
    @d3(function () {
        assert_true<IS<typeof this.target, A>>();
    })
    p: string;

}

function d4<T>() {
    return Object.assign(function (target: T, property: PropertyKey) {}, {

        parser: <T>(v: (this: T, v: any) => void) => {

            return function (target: T, property: PropertyKey) {}
        },

        validator: <T>(v: { validator: (v: any) => any } & ThisType<T>) => {
            return function (target: T, property: PropertyKey) {}
        }
    })
}

class B {

    @d4().parser(function () {
        this.p
    })
    @d4().validator({
        validator(v) {
            this.p
        }
    })
    p: string;
}

type d5_options = {
    parser: (v: any) => void,
    validator: { validator: (v: any) => void },
}

type BIND<F, T> = F extends (...args: infer U) => infer R
    ? (this: T, ...args: U) => R
    : F
;

type OPTION_DECORATE<O> = {
    [ K in keyof O ]: O[K] extends (...args: infer U) => infer R
        ? <T>(v: (this: T, ...args: U) => R) => (((target: T, proeprty: PropertyKey) => void) & OPTION_DECORATE<O>)
        : <T>(v: O[K] & ThisType<T>) => (((target: T, proeprty: PropertyKey) => void) & OPTION_DECORATE<O>)
}

function d5<T>() {
    return null as unknown as ((target: T, property: PropertyKey) => void) & OPTION_DECORATE<d5_options>
}

class d5_test {

    @d5().parser(function () {
        this.p
    })
    @d5().validator({
        validator(v) {
            this.p
        }
    })
    p: string;
}
