import di from '@/lib/dependency-injection';
import { IS } from '@/lib/types';
import { assert_true } from 'stories/asserts';

const container = di();
const { service, inject } = container;

const name = 'my_service';
const token = container.create_token<MyService>('my service');

@service(name)
    .token(token)
class MyService {

}

class MyController {

    @inject()
    s1: MyService;

    @inject(name)
    s2: any;

    @inject(token)
    s3: any;

    @inject(() => MyService)
    s4: any;


}

console.log(container.get(token));
console.log(container.get(name));

{
    let c = container.get(MyController);
    assert_true< IS< typeof c, MyController > >();
    console.log(c);
    console.log(c.s1 == c.s2);
    console.log(c.s1 == c.s3);
    console.log(c.s1 == c.s4);

}
