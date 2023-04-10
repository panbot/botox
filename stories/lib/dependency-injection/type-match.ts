import dependency_injection from '@/lib/dependency-injection';
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
    p1: MyService;

    @inject(name)
    p2: any;

    @inject(token)
    p3: MyService;

    //@ts-expect-error
    @inject(token)
    p3_error: AnotherService;

    @inject(() => MyService)
    p4: MyService;

    //@ts-expect-error
    @inject(() => MyService)
    p4_error: AnotherService;

    @inject({ type: 'class', class: MyService })
    p5: MyService;

    //@ts-expect-error
    @inject({ type: 'class', class: MyService })
    p5_error: AnotherService;

    @inject({ type: 'token', token })
    p6: MyService;

    //@ts-expect-error
    @inject({ type: 'token', token })
    p6_error: AnotherService;

    @inject({ type: 'factory', factory: get => get(MyService) })
    p7: MyService;

    //@ts-expect-error
    @inject({ type: 'factory', factory: get => get(MyService) })
    p7_error: AnotherService;

    @inject({ type: 'factory', factory: get => get(token) })
    p71: MyService;

    //@ts-expect-error
    @inject({ type: 'factory', factory: get => get(token) })
    p71_error: AnotherService;

    @inject({ type: 'get_class', get_class: () => MyService })
    p8: MyService;

    //@ts-expect-error
    @inject({ type: 'get_class', get_class: () => MyService })
    p8_error: AnotherService;

    constructor(

        @inject()
        p1: MyService,

        @inject(name)
        p2: any,

        @inject(token)
        p3: MyService,

        //@ts-expect-error
        @inject(token)
        p3_error: AnotherService,

        @inject(() => MyService)
        p4: MyService,

        //@ts-expect-error
        @inject(() => MyService)
        p4_error: AnotherService,
    ) {

    }

    method(

        //@ts-expect-error
        @inject()
        p1: MyService,

        //@ts-expect-error
        @inject(name)
        p2: any,

        //@ts-expect-error
        @inject(token)
        p3: MyService,

        //@ts-expect-error
        @inject(token)
        p3_error: AnotherService,

        //@ts-expect-error
        @inject(() => MyService)
        p4: MyService,

        //@ts-expect-error
        @inject(() => MyService)
        p4_error: AnotherService,
    ) {}
}

{
    type D<
        T,
        P,
        I,
    > = (target: T, property?: P, index?: I) => void

    function f<T, P extends T extends abstract new (...args: any) => any ? undefined : any, I extends P extends undefined ? number : undefined>(
        cb: (...args: [ T, P, I, dependency_injection.TYPE<T, P, I> ]) => void,
    ): D<T, P, I> {
        return () => {}
    }

    function g<T, P, I>(
        cb: (...args: [ T, P, I, dependency_injection.TYPE<T, P, I> ]) => void,
    ): D<T, P, I> {
        return () => {}
    }

    class A {

        @f((...args) => {})
        @g((...args) => {})
        p: string;

        constructor(
            @f((...args) => {})
            p: any,
        ) {}

        method(
            //@ts-expect-error
            @f((...args) => {})
            p: any,
        ) {}
    }
}