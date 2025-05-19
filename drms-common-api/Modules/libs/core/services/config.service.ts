import axios, { AxiosResponse } from "axios";

import { EnumStatus } from "../enums/enums";
import { RestData } from "../models/base-response.model";
import { OGConfigModel } from "../models/config.model";

class ConfigService {
    static get(): Promise<OGConfigModel> {
        return axios.get("/api/system/configs", {
            method: "GET"
        }).then(async (xhr: AxiosResponse<RestData<OGConfigModel>>) => {
            if (xhr.status === 200) {
                if (xhr.data.status === EnumStatus.OK && xhr.data.data) {
                    return xhr.data.data;
                } else {
                    return null;
                }
            }
        }).catch(error => {
            throw error;
        });
    }
}

export { ConfigService };