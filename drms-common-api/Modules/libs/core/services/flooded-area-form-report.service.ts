import axios, { AxiosResponse } from "axios";

import { OGUtils } from "../helpers/utils";
import { RestData, RestPagedDatatable } from "../models/base-response.model";
import { OGFloodedAreaFormReportModel } from "../models/urban-drainage/flooded-area-form-report/flooded-area-form-report.model";

class FloodedAreaFormReportService {
    static EXPORT: string = "/api/vi-tri-ngap-ung/report/export";
    static LIST: string = "/api/vi-tri-ngap-ung/report/list-data";

    static export(params): void {
        OGUtils.postDownload(FloodedAreaFormReportService.EXPORT, params, "application/json");
    }
    static list(params): PromiseLike<RestPagedDatatable<OGFloodedAreaFormReportModel[]>> {
        return axios({
            data: params,
            method: "POST",
            url: FloodedAreaFormReportService.LIST
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<OGFloodedAreaFormReportModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return null;
        }).catch(e => {
            throw e;
        });
    }
}

export { FloodedAreaFormReportService };
