import factory, { RunArg, RunArgFactory, Runnable } from "@/lib/runnable";

async function testRun() {
    let run = factory(c => new c());

    class RunArgFactory1 implements RunArgFactory {
        async produceRunArgFor(r: Runnable, arg1: string, arg2: number) {
            return {
                arg1,
                arg2,
            }
        }

        async aroundRun<T>(run: () => Promise<T>, r: Runnable<T>): Promise<T> {
            console.log('RunArgFactory1 before run');
            let result = await run();
            console.log('RunArgFactory1 after run');
            return result;
        }
    }

    class RunArgFactory2 implements RunArgFactory {
        async produceRunArgFor(r: Runnable, arg1: string, arg2: number) {
            return {
                arg1,
                arg2,
            }
        }

        async aroundRun<T>(run: () => Promise<T>, r: Runnable<T>): Promise<T> {
            console.log('RunArgFactory2 before run');
            let result = await run();
            console.log('RunArgFactory2 after run');
            return result;
        }
    }

    class A implements Runnable {

        async run(
            @RunArg(RunArgFactory1, 'hello', 1) runArg1: Awaited<ReturnType<RunArgFactory1["produceRunArgFor"]>>,
            @RunArg(RunArgFactory2, 'world', 2) runArg2: Awaited<ReturnType<RunArgFactory2["produceRunArgFor"]>>,
        ) {
            console.log('inside A::run()');
            console.log('runArg1', runArg1);
            console.log('runArg2', runArg2);

            return runArg1.arg1 + ' ' + runArg2.arg1;
        }
    }

    let a = new A();
    let result = await run(a);

    console.log(result);

}

testRun();