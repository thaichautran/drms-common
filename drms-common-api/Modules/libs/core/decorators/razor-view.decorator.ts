import { Layout } from "../layout";

function RazorView(arg?: string): (target: typeof Layout, context) => void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function tryInitialize(target, context): void {
        const hiddenInstanceKey = "_$$" + name + "$$_";
        if (context.kind === "class") {
            const instance = new target();
        }
        // const prevInit = Object.getOwnPropertyDescriptor(target, name).get;
        // // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-function-return-type
        // const init = (prevInit: () => any) => {
        //     return prevInit()
        //         .then(response => response[0]);
        // };
        // Object.defineProperty(target, name, {
        //     configurable: true,
        //     get: function () {
        //         return this[hiddenInstanceKey] || (this[hiddenInstanceKey] = init(prevInit.bind(this)));
        //     }
        // });
    }

    return tryInitialize;
}

export { RazorView };