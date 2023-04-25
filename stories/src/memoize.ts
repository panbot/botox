import memoize_factory from '../demo-app/services/memoize';
import destructive_aop from '@/aop/desctructive';

const memoize = memoize_factory(destructive_aop().around);

class A {

    @memoize(1000, true)
    expensive_method() {
        console.log('executing expensive calculations');
        return 5;
    }

    //@ts-expect-error
    @memoize()
    method2(a: number) {
    }
}

let a = new A;
console.log(a.expensive_method());
console.log(a.expensive_method());
console.log(a.expensive_method());
console.log(a.expensive_method());
console.log(a.expensive_method());
