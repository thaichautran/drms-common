import 'package:intl/intl.dart';

class NumberUtils {
  static String formatNumber(num number) {
    return NumberFormat.decimalPattern('vi').format(number);
  }
}
