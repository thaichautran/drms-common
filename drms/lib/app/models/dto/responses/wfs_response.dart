import 'package:vguider/app/models/base_model.dart';
import 'package:vguider/app/models/wfs.dart';

class WFSResponse extends BaseModel<WFSResponse> {
  String? type;
  List<Features>? features;

  WFSResponse({this.type, this.features});

  WFSResponse.fromJson(Map<String, dynamic> json) {
    type = json['type'];
    if (json['features'] != null) {
      features = <Features>[];
      json['features'].forEach((v) {
        features!.add(new Features.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['type'] = this.type;
    if (this.features != null) {
      data['features'] = this.features!.map((v) => v.toJson()).toList();
    }
    return data;
  }

  @override
  WFSResponse fromJson(Map<String, dynamic> json) {
    return WFSResponse.fromJson(json);
  }
}
