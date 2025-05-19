import 'package:vguider/app/models/base_model.dart';

class KichBan extends BaseModel<KichBan> {
  int? id;
  String? tenPhuongan;
  String? moTa;
  int? capPhuonganId;
  int? namXaydung;
  int? loaiPhuonganId;
  String? provinceCode;
  String? districtCode;
  dynamic communeCode;
  dynamic createdBy;
  dynamic updatedBy;
  DmLoaiPhuongan? dmLoaiPhuongan;
  DmLoaiPhuongan? dmCapPhuongan;
  Province? province;
  District? district;
  dynamic commune;
  List<ListPhuongAnMap>? listPhuongAnMap;
  List<ListPhuongAnThienTai>? listPhuongAnThienTai;
  MapModel? map;

  KichBan(
      {this.id,
      this.tenPhuongan,
      this.moTa,
      this.capPhuonganId,
      this.namXaydung,
      this.loaiPhuonganId,
      this.provinceCode,
      this.districtCode,
      this.communeCode,
      this.createdBy,
      this.updatedBy,
      this.dmLoaiPhuongan,
      this.dmCapPhuongan,
      this.province,
      this.district,
      this.commune,
      this.listPhuongAnMap,
      this.listPhuongAnThienTai,
      this.map});

  KichBan.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    tenPhuongan = json['ten_phuongan'];
    moTa = json['mo_ta'];
    capPhuonganId = json['cap_phuongan_id'];
    namXaydung = json['nam_xaydung'];
    loaiPhuonganId = json['loai_phuongan_id'];
    provinceCode = json['province_code'];
    districtCode = json['district_code'];
    communeCode = json['commune_code'];
    createdBy = json['created_by'];
    updatedBy = json['updated_by'];
    dmLoaiPhuongan = json['dmLoaiPhuongan'] != null
        ? new DmLoaiPhuongan.fromJson(json['dmLoaiPhuongan'])
        : null;
    dmCapPhuongan = json['dmCapPhuongan'] != null
        ? new DmLoaiPhuongan.fromJson(json['dmCapPhuongan'])
        : null;
    province = json['province'] != null
        ? new Province.fromJson(json['province'])
        : null;
    district = json['district'] != null
        ? new District.fromJson(json['district'])
        : null;
    commune = json['commune'];
    if (json['listPhuongAnMap'] != null) {
      listPhuongAnMap = <ListPhuongAnMap>[];
      json['listPhuongAnMap'].forEach((v) {
        listPhuongAnMap!.add(new ListPhuongAnMap.fromJson(v));
      });
    }
    if (json['listPhuongAnThienTai'] != null) {
      listPhuongAnThienTai = <ListPhuongAnThienTai>[];
      json['listPhuongAnThienTai'].forEach((v) {
        listPhuongAnThienTai!.add(new ListPhuongAnThienTai.fromJson(v));
      });
    }
    map = json['map'] != null ? new MapModel.fromJson(json['map']) : null;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['id'] = this.id;
    data['ten_phuongan'] = this.tenPhuongan;
    data['mo_ta'] = this.moTa;
    data['cap_phuongan_id'] = this.capPhuonganId;
    data['nam_xaydung'] = this.namXaydung;
    data['loai_phuongan_id'] = this.loaiPhuonganId;
    data['province_code'] = this.provinceCode;
    data['district_code'] = this.districtCode;
    data['commune_code'] = this.communeCode;
    data['created_by'] = this.createdBy;
    data['updated_by'] = this.updatedBy;
    if (this.dmLoaiPhuongan != null) {
      data['dmLoaiPhuongan'] = this.dmLoaiPhuongan!.toJson();
    }
    if (this.dmCapPhuongan != null) {
      data['dmCapPhuongan'] = this.dmCapPhuongan!.toJson();
    }
    if (this.province != null) {
      data['province'] = this.province!.toJson();
    }
    if (this.district != null) {
      data['district'] = this.district!.toJson();
    }
    data['commune'] = this.commune;
    if (this.listPhuongAnMap != null) {
      data['listPhuongAnMap'] =
          this.listPhuongAnMap!.map((v) => v.toJson()).toList();
    }
    if (this.listPhuongAnThienTai != null) {
      data['listPhuongAnThienTai'] =
          this.listPhuongAnThienTai!.map((v) => v.toJson()).toList();
    }
    if (this.map != null) {
      data['map'] = this.map!.toJson();
    }
    return data;
  }

  @override
  KichBan fromJson(Map<String, dynamic> json) {
    return KichBan.fromJson(json);
  }
}

class DmLoaiPhuongan {
  int? id;
  String? moTa;
  int? orderId;

  DmLoaiPhuongan({this.id, this.moTa, this.orderId});

  DmLoaiPhuongan.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    moTa = json['mo_ta'];
    orderId = json['order_id'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['id'] = this.id;
    data['mo_ta'] = this.moTa;
    data['order_id'] = this.orderId;
    return data;
  }
}

class Province {
  String? areaId;
  String? nameVn;
  bool? visible;
  int? order;
  dynamic proj4;
  List<Districts>? districts;

  Province(
      {this.areaId,
      this.nameVn,
      this.visible,
      this.order,
      this.proj4,
      this.districts});

  Province.fromJson(Map<String, dynamic> json) {
    areaId = json['area_id'];
    nameVn = json['name_vn'];
    visible = json['visible'];
    order = json['order'];
    proj4 = json['proj4'];
    if (json['districts'] != null) {
      districts = <Districts>[];
      json['districts'].forEach((v) {
        districts!.add(new Districts.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['area_id'] = this.areaId;
    data['name_vn'] = this.nameVn;
    data['visible'] = this.visible;
    data['order'] = this.order;
    data['proj4'] = this.proj4;
    if (this.districts != null) {
      data['districts'] = this.districts!.map((v) => v.toJson()).toList();
    }
    return data;
  }
}

class Districts {
  String? areaId;
  String? nameVn;
  String? parentId;
  String? parentName;
  bool? visible;
  int? order;
  List<Communes>? communes;

  Districts(
      {this.areaId,
      this.nameVn,
      this.parentId,
      this.parentName,
      this.visible,
      this.order,
      this.communes});

  Districts.fromJson(Map<String, dynamic> json) {
    areaId = json['area_id'];
    nameVn = json['name_vn'];
    parentId = json['parent_id'];
    parentName = json['parent_name'];
    visible = json['visible'];
    order = json['order'];
    if (json['communes'] != null) {
      communes = <Communes>[];
      json['communes'].forEach((v) {
        communes!.add(new Communes.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['area_id'] = this.areaId;
    data['name_vn'] = this.nameVn;
    data['parent_id'] = this.parentId;
    data['parent_name'] = this.parentName;
    data['visible'] = this.visible;
    data['order'] = this.order;
    if (this.communes != null) {
      data['communes'] = this.communes!.map((v) => v.toJson()).toList();
    }
    return data;
  }
}

class Communes {
  String? areaId;
  String? nameVn;
  String? parentId;
  String? parentName;
  String? proid2004;
  String? proName;
  bool? visible;
  int? order;

  Communes(
      {this.areaId,
      this.nameVn,
      this.parentId,
      this.parentName,
      this.proid2004,
      this.proName,
      this.visible,
      this.order});

  Communes.fromJson(Map<String, dynamic> json) {
    areaId = json['area_id'];
    nameVn = json['name_vn'];
    parentId = json['parent_id'];
    parentName = json['parent_name'];
    proid2004 = json['proid_2004'];
    proName = json['pro_name'];
    visible = json['visible'];
    order = json['order'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['area_id'] = this.areaId;
    data['name_vn'] = this.nameVn;
    data['parent_id'] = this.parentId;
    data['parent_name'] = this.parentName;
    data['proid_2004'] = this.proid2004;
    data['pro_name'] = this.proName;
    data['visible'] = this.visible;
    data['order'] = this.order;
    return data;
  }
}

class District {
  String? areaId;
  String? nameVn;
  String? parentId;
  String? parentName;
  bool? visible;
  int? order;
  Province? province;
  List<Communes>? communes;

  District(
      {this.areaId,
      this.nameVn,
      this.parentId,
      this.parentName,
      this.visible,
      this.order,
      this.province,
      this.communes});

  District.fromJson(Map<String, dynamic> json) {
    areaId = json['area_id'];
    nameVn = json['name_vn'];
    parentId = json['parent_id'];
    parentName = json['parent_name'];
    visible = json['visible'];
    order = json['order'];
    province = json['province'] != null
        ? new Province.fromJson(json['province'])
        : null;
    if (json['communes'] != null) {
      communes = <Communes>[];
      json['communes'].forEach((v) {
        communes!.add(new Communes.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['area_id'] = this.areaId;
    data['name_vn'] = this.nameVn;
    data['parent_id'] = this.parentId;
    data['parent_name'] = this.parentName;
    data['visible'] = this.visible;
    data['order'] = this.order;
    if (this.province != null) {
      data['province'] = this.province!.toJson();
    }
    if (this.communes != null) {
      data['communes'] = this.communes!.map((v) => v.toJson()).toList();
    }
    return data;
  }
}

class ListPhuongAnMap {
  int? phuonganId;
  dynamic phuongAn;
  int? mapId;
  MapModel? map;

  ListPhuongAnMap({this.phuonganId, this.phuongAn, this.mapId, this.map});

  ListPhuongAnMap.fromJson(Map<String, dynamic> json) {
    phuonganId = json['phuongan_id'];
    phuongAn = json['phuongAn'];
    mapId = json['map_id'];
    map = json['map'] != null ? new MapModel.fromJson(json['map']) : null;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['phuongan_id'] = this.phuonganId;
    data['phuongAn'] = this.phuongAn;
    data['map_id'] = this.mapId;
    if (this.map != null) {
      data['map'] = this.map!.toJson();
    }
    return data;
  }
}

class MapModel extends BaseModel<MapModel> {
  int? id;
  String? name;
  String? description;
  String? center;
  int? defaultzoom;
  int? minzoom;
  int? maxzoom;
  dynamic visible;
  dynamic slug;
  dynamic icon;
  int? parentId;
  dynamic permanent;
  dynamic cluster;
  String? boundary;
  dynamic mapRegions;
  dynamic mapLayers;
  dynamic mapBaseLayers;
  dynamic mapTables;

  MapModel(
      {this.id,
      this.name,
      this.description,
      this.center,
      this.defaultzoom,
      this.minzoom,
      this.maxzoom,
      this.visible,
      this.slug,
      this.icon,
      this.parentId,
      this.permanent,
      this.cluster,
      this.boundary,
      this.mapRegions,
      this.mapLayers,
      this.mapBaseLayers,
      this.mapTables});

  MapModel.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    name = json['name'];
    description = json['description'];
    center = json['center'];
    defaultzoom = json['defaultzoom'];
    minzoom = json['minzoom'];
    maxzoom = json['maxzoom'];
    visible = json['visible'];
    slug = json['slug'];
    icon = json['icon'];
    parentId = json['parent_id'];
    permanent = json['permanent'];
    cluster = json['cluster'];
    boundary = json['boundary'];
    mapRegions = json['mapRegions'];
    mapLayers = json['mapLayers'];
    mapBaseLayers = json['mapBaseLayers'];
    mapTables = json['mapTables'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['id'] = this.id;
    data['name'] = this.name;
    data['description'] = this.description;
    data['center'] = this.center;
    data['defaultzoom'] = this.defaultzoom;
    data['minzoom'] = this.minzoom;
    data['maxzoom'] = this.maxzoom;
    data['visible'] = this.visible;
    data['slug'] = this.slug;
    data['icon'] = this.icon;
    data['parent_id'] = this.parentId;
    data['permanent'] = this.permanent;
    data['cluster'] = this.cluster;
    data['boundary'] = this.boundary;
    data['mapRegions'] = this.mapRegions;
    data['mapLayers'] = this.mapLayers;
    data['mapBaseLayers'] = this.mapBaseLayers;
    data['mapTables'] = this.mapTables;
    return data;
  }

  @override
  MapModel fromJson(Map<String, dynamic> json) {
    return MapModel.fromJson(json);
  }
}

class ListPhuongAnThienTai {
  int? phuonganId;
  dynamic phuongAn;
  int? loaiThientaiId;
  DmLoaiPhuongan? loaiThienTai;

  ListPhuongAnThienTai(
      {this.phuonganId, this.phuongAn, this.loaiThientaiId, this.loaiThienTai});

  ListPhuongAnThienTai.fromJson(Map<String, dynamic> json) {
    phuonganId = json['phuongan_id'];
    phuongAn = json['phuongAn'];
    loaiThientaiId = json['loai_thientai_id'];
    loaiThienTai = json['loaiThienTai'] != null
        ? new DmLoaiPhuongan.fromJson(json['loaiThienTai'])
        : null;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['phuongan_id'] = this.phuonganId;
    data['phuongAn'] = this.phuongAn;
    data['loai_thientai_id'] = this.loaiThientaiId;
    if (this.loaiThienTai != null) {
      data['loaiThienTai'] = this.loaiThienTai!.toJson();
    }
    return data;
  }
}
