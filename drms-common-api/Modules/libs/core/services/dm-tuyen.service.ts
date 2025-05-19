import axios, { AxiosResponse } from "axios";

import { EnumStatus } from "../enums/enums";
import { RestData } from "../models/base-response.model";
import { Domain } from "../models/domain.model";

class DmTuyenService {
    static BASE_URL: string = "/api/dm-tuyen";

    static list(): Promise<Domain[]> {
        return axios.get(`${DmTuyenService.BASE_URL}`, {
            method: "GET",
        }).then(async (xhr: AxiosResponse<RestData<Domain[]>>) => {
            if (xhr.status === 200) {
                if (xhr.data.status === EnumStatus.OK && xhr.data.data) {
                    return xhr.data.data;
                } else {
                    return [];
                }
            }

        }).catch((e) => {
            throw e;
        });
    }
}

export { DmTuyenService };
