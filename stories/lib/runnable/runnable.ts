import runnable from "@/lib/runnable";
import { IS } from "@/lib/types";
import { assert_true } from "stories/asserts";

async function testRun() {

    const {
        run,
        run_arg,
    } = runnable(c => new c, 'run');

    class RunArg1 {
        constructor(
            public arg1: string
        ) { }
    }

    class RunArgFactory1 implements runnable.RunArgFactory {
        produce_run_arg(r: any, arg1: string) {
            return new RunArg1(arg1)
        }

        async around_run(r: any, run: () => any) {
            console.log('RunArgFactory1 before run');
            let result = await run();
            console.log('RunArgFactory1 after run');
            return result;
        }
    }

    class RunArg2 {
        constructor(
            public arg2: number
        ) { }
    }

    class RunArgFactory2 implements runnable.RunArgFactory {
        async produce_run_arg(r: any, arg2: number) {
            return new RunArg2(arg2)
        }

        async around_run(r: any, run: () => any) {
            console.log('RunArgFactory2 before run');
            let result = await run();
            console.log('RunArgFactory2 after run');
            return result;
        }
    }

    class A {

        run(
            @run_arg(RunArgFactory1, 'hello world') runArg1: RunArg1,
            @run_arg(RunArgFactory2, 1) runArg2: RunArg2,
        ) {
            console.log('inside A::run()');
            console.log('runArg1', runArg1);
            console.log('runArg2', runArg2);

            return runArg1.arg1 + ' ' + runArg2.arg2;
        }
    }

    let a = new A();
    let result = await run(a);

    assert_true<IS< typeof result, string >>();

    console.log(result);

}

testRun();