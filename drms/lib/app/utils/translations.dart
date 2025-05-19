import 'package:nylo_framework/nylo_framework.dart';
import 'package:vguider/app/utils/images_constants.dart';

class Translations {
  static Future<String> getLangIcon() async {
    Map<String, dynamic>? currentLang =
        await NyLanguageSwitcher.currentLanguage();
    String? _langIcon;
    print("currentLang: $currentLang");
    switch (currentLang?.entries.first.key) {
      case 'vi':
        return _langIcon = getPublicAsset('/app_icon/${ImagesConstants.vi}');

      case 'en':
        return _langIcon = getPublicAsset('/app_icon/${ImagesConstants.en}');

      case 'ko':
        return _langIcon = getPublicAsset('/app_icon/${ImagesConstants.ko}');

      default:
        return _langIcon = getPublicAsset('/app_icon/${ImagesConstants.vi}');
    }
  }

  static Future<String?> getCurrentLang() async {
    Map<String, dynamic>? currentLang =
        await NyLanguageSwitcher.currentLanguage();
    return currentLang?.entries.first.key;
  }
}
