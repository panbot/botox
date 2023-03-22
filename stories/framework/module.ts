import factory from '@/framework/module';

let Module = factory();

@Module({
    name: 'my module',
})
export class MyModule {

}
console.log(Module.getOptions(MyModule));

@Module(o => {
    o.dependencies = () => [ MyModule3 ];
}).name('my module 2')
export class MyModule2 {

}
console.log(Module.getOptions(MyModule2));

@Module().dependencies(() => [ MyModule ])
export class MyModule3 {

}
console.log(Module.getOptions(MyModule3));
