import 'package:intl/intl.dart';

class DateUtils {
  static const String shortDateFormat = "dd/MM/yyyy";
  static const String shortDateTimeFormat = "dd/MM/yyyy HH:mm";

  static String formatDate(DateTime? date, {format = shortDateFormat}) {
    if (date == null) {
      return "";
    }
    return DateFormat(format).format(date);
  }

  static String formatDateTime(DateTime? date, {format = shortDateTimeFormat}) {
    if (date == null) {
      return "";
    }
    return DateFormat(format).format(date);
  }
}
