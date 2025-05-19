import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';
import 'package:vguider/app/models/dto/extends/base_response.dart';
import 'package:vguider/app/models/dto/requests/login_dto.dart';
import 'package:vguider/app/models/dto/responses/login_response.dart';
import 'package:vguider/app/models/kich_ban.dart';
import 'package:vguider/app/models/route_segment.dart';
import 'package:vguider/app/models/tree_map_response.dart';
import 'package:vguider/app/models/wfs.dart';
import 'package:vguider/config/keys.dart';
import '/config/decoders.dart';
import 'package:nylo_framework/nylo_framework.dart';
import 'package:latlong2/latlong.dart' as latlng2;

class MapApiService extends NyApiService {
  MapApiService({BuildContext? buildContext})
      : super(buildContext, decoders: modelDecoders);
  @override
  Future<RequestHeaders> setAuthHeaders(RequestHeaders headers) async {
    String? myAuthToken = await storageRead('token');
    if (myAuthToken != null) {
      headers.addBearerToken(myAuthToken);
    }
    return headers;
  }

  @override
  String get baseUrl => getEnv('API_BASE_URL');
  @override
  get interceptors => {
        if (getEnv('APP_DEBUG') == true)
          PrettyDioLogger:
              PrettyDioLogger(requestBody: true, responseBody: false),
        // MyCustomInterceptor: MyCustomInterceptor(),
      };

  Future<BaseResponse<LoginResponse>> login(LoginDTO dto) async {
    return await network(
      request: (request) => request.post("/api/auth/login", data: {
        "username": dto.username,
        "password": dto.password,
        "rememberLogin": true,
        "returnUrl": "string",
        "allowRememberLogin": true,
        "enableLocalLogin": true,
        "externalProviders": [
          {"displayName": "string", "authenticationScheme": "string"}
        ]
      }),
      handleSuccess: (Response response) async {
        var res = BaseResponse<LoginResponse>.fromJson(
            new LoginResponse(), response.data);

        return res;
      },
      handleFailure: (error) {
        return BaseResponse<LoginResponse>.fromJson(
            new LoginResponse(), error.response?.data['status']);
      },
    );
  }

  Future<BaseListResponse<KichBan>> getListKichBan() async {
    return await network(
      request: (request) => request.post("/api/pan-ungpho-thientai/datatable",
          data: {"start": 0, "length": 50}),
      handleSuccess: (Response response) {
        return BaseListResponse<KichBan>.fromJson(new KichBan(), response.data);
      },
    );
  }

  Future<BaseResponse<MapModel>> getMapById(int id) async {
    return await network(
      request: (request) => request.get("/api/map/$id"),
      handleSuccess: (Response response) {
        return BaseResponse<MapModel>.fromJson(new MapModel(), response.data);
      },
    );
  }

  Future<BaseListResponse<TreeMapLayerGroupResponse>> getTreeLayers(
      int mapId) async {
    return await network(
      request: (request) =>
          request.get("/api/map/tree-layers", queryParameters: {
        "mapId": mapId,
      }),
      handleSuccess: (Response response) {
        return BaseListResponse<TreeMapLayerGroupResponse>.fromJson(
            new TreeMapLayerGroupResponse(), response.data);
      },
      handleFailure: (error) {},
    );
  }

  Future<WFS> wfs(
    String geometry,
    List<int> layers,
    String? classifies,
    double z,
    List<double> bbox,
  ) async {
    FormData formData = FormData.fromMap(
      {
        "layers": layers.join(","),
        "z": z.toString(),
        "bbox": bbox.join(","),
      },
    );
    return await network(
      request: (request) {
        return request.post("/api/map/wfs", data: formData);
      },
      handleSuccess: (Response response) {
        return WFS.fromJson(response.data);
      },
      handleFailure: (error) {
        return WFS.fromJson(error.response?.data);
      },
    );
  }

  Future<BaseListResponse<RouteSegment>> getRouteSegments(
      latlng2.LatLng origin, latlng2.LatLng destination) async {
    return await network(
      request: (request) =>
          request.get("/api/route/directions", queryParameters: {
        "origin": "${origin.latitude},${origin.longitude}",
        "destination": "${destination.latitude},${destination.longitude}",
      }),
      handleSuccess: (Response response) {
        return BaseListResponse<RouteSegment>.fromJson(
            new RouteSegment(), response.data);
      },
    );
  }
}
