import Axios, { AxiosResponse } from "axios";

import { EnumStatus } from "../enums/enums";
import { OGUtils } from "../helpers/utils";
import { RestData, RestPagedDatatable } from "../models/base-response.model";
import { OGGiamSatNhanVienModel } from "../models/nhan-vien.model";

class GiamSatNhanVienService {
    static delete(data: OGGiamSatNhanVienModel): Promise<void> {
        return Axios.delete("/api/nhan-vien/giam-sat/" + data.id).then(async (xhr: AxiosResponse<RestData<OGGiamSatNhanVienModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                if(xhr.data.status === EnumStatus.OK) {
                    OGUtils.alert("Xóa bản ghi giám sát nhân viên thành công!");
                }
            }
            OGUtils.error(xhr.data["errors"][0].message);
        }).catch(e => {
            throw e;
        });
    }

    static get(id: number): Promise<OGGiamSatNhanVienModel> {
        if (id === 0) {
            return undefined;
        }
        return Axios.get(`/api/nhan-vien/giam-sat/${id}`).then(async (xhr: AxiosResponse<RestData<OGGiamSatNhanVienModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static insert(data: OGGiamSatNhanVienModel): Promise<OGGiamSatNhanVienModel> {
        return Axios({
            data: data,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/nhan-vien/giam-sat/save"
        }).then(async (xhr: AxiosResponse<RestData<OGGiamSatNhanVienModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                if(xhr.data.status === EnumStatus.OK) {
                    OGUtils.alert("Lưu bản ghi giám sát thành công");
                    return xhr.data.data;
                } else {
                    OGUtils.error(xhr.data["errors"][0].message);
                }
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static list(params): Promise<RestPagedDatatable<OGGiamSatNhanVienModel[]>> {
        return Axios({
            data: params,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/nhan-vien/giam-sat/list"
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<OGGiamSatNhanVienModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
}

export { GiamSatNhanVienService };