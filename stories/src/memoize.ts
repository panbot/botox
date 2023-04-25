import memoize_factory from '@/memoize';
import destructive_aop from '@/aop/desctructive';

const memoize = memoize_factory(destructive_aop().around);

class A {

    @memoize()
    expensive_method() {
        console.log('executing expensive calculations');
        return 5;
    }
}

let a = new A;
console.log(a.expensive_method());
console.log(a.expensive_method());
console.log(a.expensive_method());
console.log(a.expensive_method());
console.log(a.expensive_method());
