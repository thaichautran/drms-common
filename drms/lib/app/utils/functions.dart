import 'dart:typed_data';

import 'package:flutter/services.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:permission_handler/permission_handler.dart';

class GeneralFunctions {
  static Future<void> requestCameraPermission() async {
    var status = await Permission.camera.status;
    if (status.isGranted) {
    } else if (status.isDenied) {
      var result = await Permission.camera.request();
      if (result.isGranted) {
      } else {}
    } else if (status.isPermanentlyDenied) {
      await openAppSettings();
    }
  }

  static Future<Uint8List> getPublicAssetAsBytes(String assetPath) async {
    ByteData data = await rootBundle.load(assetPath);
    return data.buffer.asUint8List();
  }

  static Future<void> addImageFromAsset(
      MapLibreMapController controller, String name, String assetName) async {
    final bytes = await rootBundle.load(assetName);
    final list = bytes.buffer.asUint8List();
    return controller.addImage(name, list);
  }
}
