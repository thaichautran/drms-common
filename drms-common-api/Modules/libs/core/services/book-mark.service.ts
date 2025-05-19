import Axios, { AxiosResponse } from "axios";

import { RestData, RestPagedDatatable } from "../models/base-response.model";
import { OGBookMarkModel } from "../models/book-mark.model";

class BookMarkService {
    static delete(bookMark: OGBookMarkModel): Promise<void> {
        if (!bookMark || bookMark.id === 0) {
            return undefined;
        }
        return Axios({
            data: bookMark,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/bookmark/delete",
        });
    }

    static get(key: string): Promise<OGBookMarkModel> {
        if (!key) {
            return undefined;
        }
        return Axios.get("/api/bookmark/" + key).then(async (xhr: AxiosResponse<RestData<OGBookMarkModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static insert(bookMark: OGBookMarkModel): Promise<OGBookMarkModel> {
        return Axios.post("/api/bookmark/add", bookMark).then(async (xhr: AxiosResponse<RestData<OGBookMarkModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static list(params): Promise<RestPagedDatatable<OGBookMarkModel[]>> {
        return Axios({
            data: params,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/bookmark/list"
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<OGBookMarkModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
}

export { BookMarkService };