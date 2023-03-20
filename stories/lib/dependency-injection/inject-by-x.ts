import di from '@/lib/dependency-injection';
import { Constructor } from '@/lib/types';

const Container = di();

interface HasName {
    name: { toString(): string };
}

function injectBy(x: any) {
    class A implements HasName {

        @Container.Inject(x)
        name!: string;
    }
    return A;
}

function test(c: Constructor<HasName>) {
    console.log('inject by ' + Container.instantiate(c).name);
}

Container.set('name', 'string');
test(injectBy('name'));

let token = Container.token('name');
Container.set(token, 'token');
test(injectBy(token));

class Factory {
    toString() { return 'factory' }
}
test(injectBy(() => Factory));


function injectByType() {

    class Type {
        toString() { return 'type' }
    }

    class A implements HasName {

        @Container.Inject()
        name!: Type;
    }
    return A;
}
test(injectByType());
