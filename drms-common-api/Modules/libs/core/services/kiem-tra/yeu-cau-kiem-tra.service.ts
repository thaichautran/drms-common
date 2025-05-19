import Axios, { AxiosResponse } from "axios";

import { EnumStatus } from "../../enums/enums";
import { OGUtils } from "../../helpers/utils";
import { RestData, RestPagedDatatable } from "../../models/base-response.model";
import { OGYeuCauKiemTraModel } from "../../models/kiem-tra/yeu-cau-kiem-tra.model";


class YeuCauKiemTraService {
    static delete(baseLayer: OGYeuCauKiemTraModel): Promise<void> {
        if (!baseLayer || baseLayer.id === 0) {
            return undefined;
        }
        return Axios({
            data: baseLayer,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/yeu-cau-kiem-tra/delete",
        });
    }

    static get(id: number): Promise<OGYeuCauKiemTraModel> {
        if (id === 0) {
            return undefined;
        }
        return Axios.get("/api/yeu-cau-kiem-tra/" + id).then(async (xhr: AxiosResponse<RestData<OGYeuCauKiemTraModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static insert(item: OGYeuCauKiemTraModel): Promise<OGYeuCauKiemTraModel> {
        return Axios.post("/api/yeu-cau-kiem-tra/save", item).then(async (xhr: AxiosResponse<RestData<OGYeuCauKiemTraModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                if (xhr.data.status === EnumStatus.OK) {
                    OGUtils.alert("Lưu yêu cầu kiểm tra thành công!");
                    return xhr.data.data;
                } else {
                    OGUtils.error("Lưu yêu cầu kiểm tra thất bại!");
                }
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static list(params): Promise<RestPagedDatatable<OGYeuCauKiemTraModel[]>> {
        return Axios({
            data: params,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/yeu-cau-kiem-tra/list"
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<OGYeuCauKiemTraModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
}

export { YeuCauKiemTraService };