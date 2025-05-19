import Axios, { AxiosResponse } from "axios";

import { RestData, RestPagedDatatable } from "../models/base-response.model";
import { OGCalendarTreeModel } from "../models/maintenance.model";

class CalendarService {
    static get(id: number): Promise<OGCalendarTreeModel> {
        if (id === 0) {
            return undefined;
        }
        return Axios.get(`/api/lich-cham-soc/${id}`).then(async (xhr: AxiosResponse<RestData<OGCalendarTreeModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static list(params): Promise<RestPagedDatatable<OGCalendarTreeModel[]>> {
        return Axios({
            data: params,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/lich-cham-soc/list"
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<OGCalendarTreeModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
}

export { CalendarService };