import Axios, { AxiosError, AxiosResponse } from "axios";

import { EnumStatus } from "../enums/enums";
import { RestBase, RestData, RestError, RestPagedDatatable } from "../models/base-response.model";
import { OGDanhMucModel } from "../models/document.model";
import { OGTableColumnModel, OGTableModel, OGTableRelationModel, OGTableSchemaModel } from "../models/table.model";

class TableSchemaService {
    static BASE_URL = "/api/table/schema";
    static delete(entity: OGTableSchemaModel): Promise<void> {
        if (!entity) {
            return undefined;
        }
        return Axios({
            data: entity,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: this.BASE_URL + "/delete",
        });
    }
    static get(schema: string): Promise<OGTableSchemaModel> {
        if (!schema) {
            return undefined;
        }
        return Axios.get(`${this.BASE_URL}/${schema}`).then(async (xhr: AxiosResponse<RestData<OGTableSchemaModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static list(params): Promise<RestPagedDatatable<OGTableSchemaModel[]>> {
        return Axios.post(`${this.BASE_URL}/list`, params).then(async (xhr: AxiosResponse<RestPagedDatatable<OGTableSchemaModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static sync(tableSchema?: string): Promise<boolean> {
        return Axios.post("/api/table/schema/sync", {}, {
            params: {
                schema: tableSchema
            }
        }).then(async (xhr: AxiosResponse<RestData<boolean>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static update(table: OGTableSchemaModel): Promise<OGTableSchemaModel> {
        return Axios.post(`${this.BASE_URL}/update`, table).then(async (xhr: AxiosResponse<RestData<OGTableSchemaModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
}

class TableService {
    static countData(id: number): Promise<number> {
        if (!id || id === 0) {
            return undefined;
        }
        return Axios.get(`/api/table/count-data/${id}`).then(async (xhr: AxiosResponse<RestData<number>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static deleteRecord(table_id: number, id: number): Promise<RestBase | RestError> {
        if (table_id && id) {
            return Axios.post(`/api/table/${table_id}/delete/${id}`).then(async (xhr: AxiosResponse<RestBase | RestError>) => {
                if (xhr.status === 200 && xhr.data) {
                    return xhr.data;
                }
                return undefined;
            }).catch(e => {
                throw e;
            });
        }
        return undefined;
    }
    static drop(table_id: number): Promise<void> {
        if (table_id === 0) {
            return undefined;
        }
        return Axios({
            data: {
                table_id: table_id
            },
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/table/drop",
        });
    }

    static get(id: number): Promise<OGTableModel> {
        if (!id || id === 0) {
            return undefined;
        }
        return Axios.get(`/api/table/${id}`).then(async (xhr: AxiosResponse<RestData<OGTableModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static getRelations(id: number, isBacktracking?: boolean): Promise<OGTableRelationModel[]> {
        return Axios.get("/api/table/relations", {
            params: {
                isBacktracking: isBacktracking,
                table_id: id
            }
        }).then((xhr: AxiosResponse<RestData<OGTableRelationModel[]>>) => {
            if (xhr.status === 200) {
                if (xhr.data.status === EnumStatus.OK && xhr.data.data) {
                    return xhr.data.data;
                }
            }
        }).catch((error: AxiosError) => {
            throw error;
        });
    }

    static getTables(mapId?: number, keyword?: string, hasLayer?: boolean): Promise<RestData<OGTableModel[]>> {
        return Axios.get("/api/table/getTables", {
            params: {
                hasLayer: hasLayer,
                keyword: keyword,
                mapId: mapId
            }
        }).then((xhr: AxiosResponse<RestData<OGTableModel[]>>) => {
            if (xhr.status === 200) {
                return xhr.data;
            }
            return undefined;
        }).catch((error: AxiosError) => {
            throw error;
        });
    }

    static insert(table: OGTableModel): Promise<OGTableModel> {
        return Axios.post("/api/table/create", table).then(async (xhr: AxiosResponse<RestData<OGTableModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static insertRecord(table_id: number, dto: object): Promise<RestBase | RestError> {
        if (table_id && dto) {
            return Axios.post(`/api/table/${table_id}/insert`, dto).then(async (xhr: AxiosResponse<RestBase | RestError>) => {
                if (xhr.status === 200 && xhr.data) {
                    return xhr.data;
                }
                return undefined;
            }).catch(e => {
                throw e;
            });
        }
        return undefined;
    }
    static list(params): Promise<RestPagedDatatable<OGTableModel[]>> {
        return Axios.post("/api/table/list", params).then(async (xhr: AxiosResponse<RestPagedDatatable<OGTableModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static record(table_id: number, id: number): Promise<object> {
        if (table_id && id) {
            return Axios.get(`/api/table/${table_id}/record/${id}`).then(async (xhr: AxiosResponse<RestData<object>>) => {
                if (xhr.status === 200 && xhr.data) {
                    return xhr.data.data;
                }
                return undefined;
            }).catch(e => {
                throw e;
            });
        }
        return undefined;
    }
    static records(id: number, params): Promise<RestData<RestPagedDatatable<object>>> {
        if (!id || id === 0) {
            return undefined;
        }
        return Axios.post(`/api/table/${id}/records`, params).then(async (xhr: AxiosResponse<RestData<RestPagedDatatable<object>>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static shortData(params): Promise<OGDanhMucModel[]> {
        return Axios.post("/api/table/short-data", params).then(async (xhr: AxiosResponse<RestData<OGDanhMucModel[]>>) => {
            if (xhr.status === 200 && xhr.data.status === EnumStatus.OK) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static shortDataPaged(params): Promise<RestPagedDatatable<OGDanhMucModel[]>> {
        return Axios.post("/api/table/short-data", params).then(async (xhr: AxiosResponse<RestPagedDatatable<OGDanhMucModel[]>>) => {
            if (xhr.status === 200 && xhr.data.status === EnumStatus.OK) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static update(table: OGTableModel): Promise<OGTableModel> {
        return Axios.post("/api/table/update", table).then(async (xhr: AxiosResponse<RestData<OGTableModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static updateRecord(table_id: number, dto: object): Promise<RestBase | RestError> {
        if (table_id && dto) {
            return Axios.post(`/api/table/${table_id}/update`, dto).then(async (xhr: AxiosResponse<RestBase | RestError>) => {
                if (xhr.status === 200 && xhr.data) {
                    return xhr.data;
                }
                return undefined;
            }).catch(e => {
                throw e;
            });
        }
        return undefined;
    }
}

class TableColumnService {
    static dataByName(table_name?: string, column_name?: string, q?: string, page?: number, page_size?: number): Promise<RestPagedDatatable<string>> {
        return Axios({
            data: JSON.stringify({
                column_name: column_name,
                page: page,
                page_size: page_size,
                q: q,
                table_name: table_name,
            }),
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST",
            url: "/api/table/columns/data-by-name",
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<string>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static delete(column: OGTableColumnModel): Promise<void> {
        if (!column || column.id === 0 || column.table_id === 0) {
            return undefined;
        }
        return Axios({
            data: column,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/table/" + column.table_id + "/columns/delete",
        });
    }
    static get(id: number): Promise<OGTableColumnModel> {
        if (!id || id === 0) {
            return undefined;
        }
        return Axios.get("/api/table/columns/" + id).then(async (xhr: AxiosResponse<RestData<OGTableColumnModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static insert(column: OGTableColumnModel): Promise<OGTableColumnModel> {
        return Axios.post("/api/table/" + column.table_id + "/columns/add", column).then(async (xhr: AxiosResponse<RestData<OGTableColumnModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static list(table_id: number, isGroup?: boolean): Promise<RestData<OGTableColumnModel[]>> {
        return Axios.get("/api/table/" + table_id + "/columns", {
            params: {
                isGroup: isGroup ?? false
            }
        }).then(async (xhr: AxiosResponse<RestData<OGTableColumnModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static listDistinctValues(column: OGTableColumnModel, q?: string, page?: number, pageSize?: number): Promise<RestPagedDatatable<string>> {
        return Axios.get("/api/table/columns/" + column.id + "/distinct-values", {
            params: {
                page: page || 1,
                pageSize: pageSize || 25,
                q: q,
            }
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<string>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static moveDown(column: OGTableColumnModel): Promise<RestData<OGTableColumnModel>> {
        return Axios.post("/api/table/" + column.table_id + "/columns/moveDown", column).then(async (xhr: AxiosResponse<RestData<OGTableColumnModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static moveUp(column: OGTableColumnModel): Promise<RestData<OGTableColumnModel>> {
        return Axios.post("/api/table/" + column.table_id + "/columns/moveUp", column).then(async (xhr: AxiosResponse<RestData<OGTableColumnModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static syncAllColumns(tableSchema?: string): Promise<RestData<boolean> | RestError> {
        return Axios.get("/api/table/columns/sync", {
            params: tableSchema ? {
                tableSchema: tableSchema
            } : {}
        }).then(async (xhr: AxiosResponse<RestData<boolean> | RestError>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static syncColumns(tableId: number): Promise<RestData<boolean> | RestError> {
        return Axios.get("/api/table/" + tableId + "/columns/sync").then(async (xhr: AxiosResponse<RestData<boolean> | RestError>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static update(column: OGTableColumnModel): Promise<OGTableColumnModel> {
        return Axios.post("/api/table/" + column.table_id + "/columns/update", column).then(async (xhr: AxiosResponse<RestData<OGTableColumnModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
}

export { TableColumnService, TableSchemaService, TableService };