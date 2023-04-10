import di from '@/lib/dependency-injection';

const container = di();
const { service, inject } = container;

const name = 'my_service';
const token = container.create_token<MyService>('my service');

@service(name)
    .token(token)
class MyService {

    do_my_service_stuff() { }
}

class AnotherService {

    do_another_service_stuff() { }

}

class MyController {

    @inject()
    s1: MyService;

    @inject(name)
    s2: any;

    @inject(token)
    s3: MyService;

    //@ts-expect-error
    @inject(token)
    s3_error: AnotherService;

    @inject(() => MyService)
    s4: MyService;

    //@ts-expect-error
    @inject(() => MyService)
    s4_error: AnotherService;
}
