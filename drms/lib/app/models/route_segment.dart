import 'package:vguider/app/models/base_model.dart';

class RouteSegment extends BaseModel<RouteSegment> {
  int? seq;
  int? id;
  String? name;
  double? seconds;
  double? lengthM;
  double? azimuth;
  String? encoded;

  RouteSegment(
      {this.seq,
      this.id,
      this.name,
      this.seconds,
      this.lengthM,
      this.azimuth,
      this.encoded});

  RouteSegment.fromJson(Map<String, dynamic> json) {
    seq = json['seq'];
    id = json['id'];
    name = json['name'];
    seconds = json['seconds'];
    lengthM = json['length_m'];
    azimuth = json['azimuth'];
    encoded = json['encoded'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['seq'] = this.seq;
    data['id'] = this.id;
    data['name'] = this.name;
    data['seconds'] = this.seconds;
    data['length_m'] = this.lengthM;
    data['azimuth'] = this.azimuth;
    data['encoded'] = this.encoded;
    return data;
  }

  @override
  RouteSegment fromJson(Map<String, dynamic> json) {
    return RouteSegment.fromJson(json);
  }
}
