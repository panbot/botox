import { DestructiveAop } from 'lib/aop';

const { Before, After } = DestructiveAop();

class Target {

    @Before(pc => {
        console.log('before', pc);
        console.log('original arguments', pc.args);
        pc.args = pc.args.map(v => v += '(touched by before advisor)')
    })
    testBefore(...args: any) {
        console.log('inside before');
        console.log('final arguments', args);
    }

    @After(pc => {
        console.log('after', pc);
        return 2;
    })
    testAfter() {
        console.log('inside after');
        let ret = 1;
        console.log('original return value', ret);
        return ret;
    }

    testAround() {

    }
}

let t = new Target();
t.testBefore(1, 2, 3);
console.log('final return value:', t.testAfter());

