import { find } from "lodash";

export class Container {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private _providers: { [key: string]: any } = {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public providers(): { [key: string]: any } {
        {
            return this._providers;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public resolve(token: string): any {
        const matchedProvider = find(
            this._providers,
            (_provider, key) => key === token
        );

        if (matchedProvider) {
            return matchedProvider;
        } else {
            throw new Error(`No provider found for ${token}!`);
        }
    }
}

export const container = new Container();