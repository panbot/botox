import di from '@/lib/dependency-injection';
import { CONSTRUCTOR } from '@/lib/types';

const container = di();

const inject_sound = (sound: string) => container.create_inject(() => sound);

interface CanMakeSound {
    make_sound(): void;
}

function with_constructor_parameters() {

    abstract class Animal implements CanMakeSound {

        constructor(
            private sound: string,
        ) { }

        make_sound() {
            console.log(this.constructor.name, 'making sound is like', `"${this.sound}"`);
        }
    }

    class Dog extends Animal {
        constructor(
            @inject_sound('woof')
            sound: string,
        ) {
            super(sound);
        }
    }

    class SmallDog extends Dog {
        constructor(
            @inject_sound('arf')
            sound: string,
        ) {
            super(sound);
        }
    }

    return [ Dog, SmallDog ]
}

function with_protected_member_properties() {

    abstract class Animal implements CanMakeSound {

        protected abstract sound: string;

        make_sound() {
            console.log(this.constructor.name, 'making sound is like', `"${this.sound}"`);
        }
    }

    class Dog extends Animal {
        @inject_sound('woof')
        protected sound!: string;
    }

    class SmallDog extends Dog {
        @inject_sound('arf')
        declare protected sound: string;

    }

    return [ Dog, SmallDog ]
}

function test(ctors: CONSTRUCTOR<CanMakeSound>[]) {
    for (let c of ctors) {
        container.instantiate(c).make_sound();
    }
}

test(with_constructor_parameters());
test(with_protected_member_properties());
