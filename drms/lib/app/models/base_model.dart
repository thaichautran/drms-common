import 'package:nylo_framework/nylo_framework.dart';

abstract class BaseModel<T> extends Model {
  T fromJson(Map<String, dynamic> json);
}
