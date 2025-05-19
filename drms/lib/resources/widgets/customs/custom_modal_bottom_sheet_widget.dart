import 'package:flutter/material.dart';
import 'package:nylo_framework/nylo_framework.dart';

class CustomModalBottomSheet extends StatefulWidget {
  const CustomModalBottomSheet({super.key});
  static showBottomModal(BuildContext context,
      {double? height,
      String? title,
      required Widget child,
      bool showDragHandle = false}) async {
    showModalBottomSheet(
        useRootNavigator: true,
        showDragHandle: showDragHandle,
        context: context,
        builder: (BuildContext context) {
          return SafeArea(
              child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (title != null)
                Text("$title".tr())
                    .headingMedium(
                        color: NyColor(light: Colors.black, dark: Colors.white)
                            .toColor(context))
                    .fontWeightBold()
                    .setFontSize(18)
                    .paddingOnly(top: 16, bottom: 8),
              Flexible(
                fit: FlexFit.tight,
                child: SizedBox(
                  height: height ?? MediaQuery.of(context).size.height / 2,
                  child: child,
                ),
              )
            ],
          ));
        });
  }

  static String state = "custom_modal_bottom_sheet";
  @override
  createState() => _CustomModalBottomSheetState();
}

class _CustomModalBottomSheetState extends NyState<CustomModalBottomSheet> {
  _CustomModalBottomSheetState() {
    stateName = CustomModalBottomSheet.state;
  }

  @override
  get init => () {};

  @override
  Widget view(BuildContext context) {
    return Container();
  }
}
