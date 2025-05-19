import { container } from "../instances/container";

// eslint-disable-next-line @typescript-eslint/ban-types
export function Injectable(token: string): Function {
    return function (target: { new() }): void {
        container.providers[token] = new target();
    };
}