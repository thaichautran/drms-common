import { container } from "../instances/container";

export function Inject(token: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function (target: any, key: string) {
        Object.defineProperty(target, key, {
            configurable: true,
            enumerable: true,
            get: () => container.resolve(token)
        });
    };
}