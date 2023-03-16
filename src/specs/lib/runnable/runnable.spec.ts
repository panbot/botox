import factory, { Runnable } from "lib/runnable";

async function testRun() {
    let run = factory(c => new c());


    class A implements Runnable {

        async run() {
            return 1;
        }
    }

    let a = new A();
    let result = await run(a);

    console.log(result);

}

testRun();