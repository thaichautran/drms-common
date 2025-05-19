import Axios, { AxiosResponse } from "axios";

import { EnumStatus } from "../enums/enums";
import { RestBase, RestError } from "../models/base-response.model";

class AuthService {
    static BASE_PATH = "/api/auth";
    static login(loginModel): Promise<RestBase | RestError> {
        return Axios.post(`${this.BASE_PATH}/login`, loginModel).then(async (xhr: AxiosResponse<RestBase | RestError>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
}

export { AuthService };