import { IS } from "@/lib/types";
import { assert_true } from "stories/asserts";

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
