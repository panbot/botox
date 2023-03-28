import aop from '@/lib/aop/proxitive';
import { CONSTRUCTOR } from '@/lib/types';

let proxify: any;
export const { before, after, around } = aop(p => proxify = p);
function instantiate<T>(ctor: CONSTRUCTOR<T>) {
    return proxify(new ctor);
}

class Base {
    @before(pc => {
        console.log('before ', pc.method, pc)
    })
    test_before(...args: any[]) {

    }
}

class Sub extends Base {

}

class SubSub extends Sub {
    // @before(pc => {
    //     console.log('before subsub ', pc.method, pc)
    // })
    override test_before(...args: any[]) {

    }
}

{
    let instance = instantiate(Base);
    instance.test_before();
}

{
    let instance = instantiate(Sub);
    instance.test_before();
}

{
    let instance = instantiate(SubSub);
    instance.test_before();
}
