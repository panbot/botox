import runnable from "@/lib/runnable";
import { IS } from "@/lib/types";
import { assert_true } from "stories/asserts";

async function testRun() {

    const {
        run,
        run_arg,
    } = runnable(c => new c);

    class RunArgFactory1 implements runnable.RunArgFactory {
        async produce_run_arg(r: runnable.Runnable, arg1: string, arg2: number) {
            return {
                arg1,
                arg2,
            }
        }

        async around_run<T>(r: runnable.Runnable<T>, run: () => Promise<T>): Promise<T> {
            console.log('RunArgFactory1 before run');
            let result = await run();
            console.log('RunArgFactory1 after run');
            return result;
        }
    }

    class RunArgFactory2 implements runnable.RunArgFactory {
        async produce_run_arg(r: runnable.Runnable, arg1: string, arg2: number) {
            return {
                arg1,
                arg2,
            }
        }

        async around_run<T>(r: runnable.Runnable<T>, run: () => Promise<T>): Promise<T> {
            console.log('RunArgFactory2 before run');
            let result = await run();
            console.log('RunArgFactory2 after run');
            return result;
        }
    }

    class A implements runnable.Runnable {

        async run(
            @run_arg(RunArgFactory1, 'hello', 1) runArg1: Awaited<ReturnType<RunArgFactory1["produce_run_arg"]>>,
            @run_arg(RunArgFactory2, 'world', 2) runArg2: Awaited<ReturnType<RunArgFactory2["produce_run_arg"]>>,
        ) {
            console.log('inside A::run()');
            console.log('runArg1', runArg1);
            console.log('runArg2', runArg2);

            return runArg1.arg1 + ' ' + runArg2.arg1;
        }
    }

    let a = new A();
    let result = await run(a);

    assert_true<IS< typeof result, string >>();

    console.log(result);

}

testRun();