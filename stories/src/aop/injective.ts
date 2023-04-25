import injective_aop_factory from "@/aop/injective";

const inject = injective_aop_factory();

let o = {
    set_value(v: any) {
        console.log(v);
    }
}

o.set_value(1);

inject(o).before('set_value', p => {
    console.log('before', p.target.constructor.name, p.method, 'args', p.args);
    p.args = [ 5 ];
});

o.set_value(2);
