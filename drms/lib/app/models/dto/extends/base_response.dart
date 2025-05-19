import 'dart:convert';

import '../../base_model.dart';

class BaseResponse<T extends BaseModel<T>> {
  String? status;
  T? data;

  BaseResponse();

  BaseResponse.fromJson(T instance, Map<String, dynamic> json) {
    status = json['status'];
    if (json['data'] != null) {
      if (json['data'] is Map) {
        data = instance.fromJson(json['data']);
      } else if (json['data'] is List) {
        throw Exception("data is array, please specify as BaseListResponse");
      }
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['status'] = this.status;
    if (this.data != null) {
      data['data'] = this.data!.toJson();
    }
    return data;
  }
}

class BaseListResponse<T extends BaseModel<T>> {
  String? status;
  List<T>? data;

  BaseListResponse();

  BaseListResponse.fromJson(T instance, Map<String, dynamic> json) {
    status = json['status'];
    if (json['data'] != null) {
      if (json['data'] is Map) {
        throw Exception("data is Map, please specify as BaseResponse");
      } else if (json['data'] is List) {
        data = (json['data'] as List).map((element) {
          return instance.fromJson(element);
        }).toList();
      }
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['status'] = this.status;
    if (this.data != null) {
      data['data'] = jsonEncode(this.data);
    }
    return data;
  }
}
