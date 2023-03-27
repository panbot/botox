import di from '@/lib/dependency-injection';
import { proxitive_aop } from '@/lib/aop';

const Container = di();

export const { before, after, around } = proxitive_aop(proxifier => Container.on('instantiated', proxifier));

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
    let instance = Container.instantiate(Base);
    instance.test_before();
}

{
    let instance = Container.instantiate(Sub);
    instance.test_before();
}

{
    let instance = Container.instantiate(SubSub);
    instance.test_before();
}
