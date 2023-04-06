import aop from '@/lib/aop/desctructive';
import { IS } from '@/lib/types';
import { assert_true } from 'stories/asserts';

const { before, after, around } = aop();


class MyClass {

    @after(p => {
        assert_true<IS<typeof p.target, MyClass>>();
    })
    my_method(a: string, b: number) {

    }
}