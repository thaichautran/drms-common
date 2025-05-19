import Axios, { AxiosResponse } from "axios";
import { data } from "jquery";

import { EnumStatus } from "../enums/enums";
import { OGUtils } from "../helpers/utils";
import { RestData } from "../models/base-response.model";
import { OGCatgoryModel } from "../models/category.model";

class CategoryService {
    static delete(data: OGCatgoryModel): Promise<void> {
        return Axios({
            data: data,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/category/delete"
        }).then(async (xhr: AxiosResponse<RestData<OGCatgoryModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                if (xhr.data.status == EnumStatus.OK) {
                    OGUtils.alert("Xóa danh mục thành công!");
                } else {
                    OGUtils.error("Đã xảy ra lỗi, vui lòng kiểm tra lại!");
                }
            } else {
                OGUtils.error("Đã xảy ra lỗi, vui lòng kiểm tra lại!");
            }
        }).catch(e => {
            throw e;
        });
    }
    static get(id: number): Promise<OGCatgoryModel> {
        if (id === 0) {
            return undefined;
        }
        return Axios.get(`/api/lich-cham-soc/${id}`).then(async (xhr: AxiosResponse<RestData<OGCatgoryModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static insert(data: OGCatgoryModel): Promise<RestData<OGCatgoryModel>> {
        return Axios({
            data: data,
            method: "POST",
            url: "/api/category/createOrUpdate"
        }).then(async (xhr: AxiosResponse<RestData<OGCatgoryModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                if (xhr.data.status == EnumStatus.OK) {
                    OGUtils.alert("Lưu danh mục thành công!");
                } else {
                    OGUtils.error("Đã xảy ra lỗi, vui lòng kiểm tra lại!");
                }
                return xhr.data;
            } else {
                OGUtils.error("Đã xảy ra lỗi, vui lòng kiểm tra lại!");
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static list(categoryTypeID): Promise<RestData<OGCatgoryModel[]>> {
        return Axios.get("/api/category/" + categoryTypeID + "/items").then(async (xhr: AxiosResponse<RestData<OGCatgoryModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

}

export { CategoryService };