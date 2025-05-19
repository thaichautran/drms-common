import 'package:vguider/app/models/base_model.dart';

class LoginResponse extends BaseModel<LoginResponse> {
  String? access_token;
  List<dynamic>? roles;
  int? status;
  LoginResponse({this.access_token, this.status, this.roles});

  LoginResponse.fromJson(Map<String, dynamic> json) {
    access_token = json['access_token'];
    roles = json['roles'] != null ? List<dynamic>.from(json['roles']) : null;
    status = json['status'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['access_token'] = this.access_token;
    data['roles'] = this.roles;
    data['status'] = this.status;
    return data;
  }

  @override
  LoginResponse fromJson(Map<String, dynamic> json) {
    return LoginResponse.fromJson(json);
  }
}
