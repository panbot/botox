import { destructive_aop } from '@/lib/aop';

const { Before, After, Around } = destructive_aop();

class Target {

    @Before(pc => {
        console.log('before', pc);
        console.log('original arguments', pc.args);
        pc.args = pc.args.map(v => v += '(touched by before advisor)')
    })
    test_before(...args: any) {
        console.log('inside before');
        console.log('final arguments', args);
    }

    @After(pc => {
        console.log('after', pc);
        return 2;
    })
    test_after() {
        console.log('inside after');
        let ret = 1;
        console.log('original return value', ret);
        return ret;
    }

    @Around(pc => {
        console.log('before test around', pc);
        pc.args = pc.args.map(v => `${v} (arg adviced)`);
        let result = pc.invoke();
        console.log('after invoke test_around, result', result);
        return (result as any[]).map(v => `${v} (result adviced)`);
    })
    test_around(...args: any[]) {
        console.log('inside around, args', args);
        return args.map(a => `${a} (processed)`)
    }
}

function test(t: Target) {
    t.test_before(1, 2, 3);
    console.log('test_after final return value:', t.test_after());
    console.log('test_around final return value', t.test_around('a', 'b', 'c'));
}

test(new Target());

class SubTarget extends Target {

}
test(new SubTarget());
