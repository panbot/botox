import aop_factory from "@/aop/factory";
import { IS } from "@/types";
import { assert_true } from "stories/asserts";

{
    let { before, after, around } = aop_factory(() => {});

    class A {

        //@ts-expect-error
        @before(p => {})
        //@ts-expect-error
        @after(p => {})
        //@ts-expect-error
        @around(p => {})
        p: number;

        @before(p => {
            assert_true<IS<typeof p.target, A>>();
            assert_true<IS<typeof p.method, 'test'>>();
            assert_true<IS<typeof p.args, [ n: number ]>>();
        })
        @after(p => {
            assert_true<IS<typeof p.target, A>>();
            assert_true<IS<typeof p.method, 'test'>>();
            assert_true<IS<typeof p.args, [ n: number ]>>();
            assert_true<IS<typeof p.result, string>>();
            assert_true<IS<typeof p.error, boolean>>();
        })
        @around(p => {
            assert_true<IS<typeof p.target, A>>();
            assert_true<IS<typeof p.method, 'test'>>();
            assert_true<IS<typeof p.args, [ n: number ]>>();
            assert_true<IS<typeof p.invoke, () => string>>();
        })
        test(n: number) { return n.toFixed(2) }
    }
}


{
    function d<T, M, D>(
        advice: (
            pointcut: {
                target: T,
                method: M,
                args: D extends (...arg: infer U) => any ? U : never,
                result: D extends (...arg: any) => infer R ? R : never,
            }
        ) => void
    ) {

        return function(target: T, method: M, decorator: TypedPropertyDescriptor<D>) {

        }
    }

    class A {

        //@ts-expect-error
        @d(p => {})
        p: number;


        @d(p => {
            assert_true<IS<typeof p.target, A>>();
            assert_true<IS<typeof p.method, 'b'>>();
            assert_true<IS<typeof p.args, [ date: Date ]>>();
            assert_true<IS<typeof p.result, number>>();
        })
        b(date: Date): number {
            return 5
        }
    }
}
