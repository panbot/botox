import { IS } from "@/lib/types";

export function assert_true <T extends true >() {}
export function assert_false<T extends false>() {}
export function assert_of_type<T>(x: T) {}

export function assert_type<X>() {
    function can_be_satisfied_by<Y extends X>(y?: Y) {};

    type SATISFY<A, B> = A extends B ? any : never
    function satisfies< Y extends SATISFY<X, Y> >() {}
    function satisfies_typeof<Y extends SATISFY<X, Y>>(y: Y) {}

    return {
        can_be_satisfied_by,
        satisfies,
        satisfies_typeof,
    }
}
