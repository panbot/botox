import di from '@/lib/dependency-injection';
import { CONSTRUCTOR } from '@/lib/types';

const container = di();

interface HasName {
    name: { toString(): string };
}

function injectBy(x: any) {
    class A implements HasName {

        @container.inject(x)
        name!: string;
    }
    return A;
}

function test(c: CONSTRUCTOR<HasName>) {
    console.log('inject by ' + container.instantiate(c).name);
}

container.set('name', 'string');
test(injectBy('name'));

let token = container.create_token('name');
container.set(token, 'token');
test(injectBy(token));

@container.service()
class Factory {
    toString() { return 'factory' }
}
test(injectBy(() => Factory));


function injectByType() {

    @container.service()
    class Type {
        toString() { return 'type' }
    }

    class A implements HasName {

        @container.inject()
        name: Type;
    }
    return A;
}
test(injectByType());
