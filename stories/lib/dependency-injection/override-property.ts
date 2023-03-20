import di from '@/lib/dependency-injection';
import { Constructor } from '@/lib/types';

const Container = di();

const injectSound = (sound: string) => Container.createInject(() => sound);

interface CanMakeSound {
    makeSound(): void;
}

function withConstructorParameters() {

    abstract class Animal {

        constructor(
            private sound: string,
        ) { }

        makeSound() {
            console.log(this.constructor.name, 'making sound is like', `"${this.sound}"`);
        }
    }

    class Dog extends Animal {
        constructor(
            @injectSound('woof')
            sound: string,
        ) {
            super(sound);
        }
    }

    class SmallDog extends Dog {
        constructor(
            @injectSound('arf')
            sound: string,
        ) {
            super(sound);
        }
    }

    return [ Dog, SmallDog ]
}

function withProtecedMemberProperties() {

    abstract class Animal {

        protected abstract sound: string;

        makeSound() {
            console.log(this.constructor.name, 'making sound is like', `"${this.sound}"`);
        }
    }

    class Dog extends Animal {
        @injectSound('woof')
        protected sound!: string;
    }

    class SmallDog extends Dog {
        @injectSound('arf')
        declare protected sound: string;

    }

    return [ Dog, SmallDog ]
}

function test(ctors: Constructor<CanMakeSound>[]) {
    for (let c of ctors) {
        Container.instantiate(c).makeSound();
    }
}

test(withConstructorParameters());
test(withProtecedMemberProperties());
