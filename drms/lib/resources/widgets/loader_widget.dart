import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:vguider/resources/widgets/custom_loading_widget.dart';

class Loader extends StatelessWidget {
  const Loader({super.key});

  @override
  Widget build(BuildContext context) {
    switch (Theme.of(context).platform) {
      case TargetPlatform.android:
        return const Center(child: CustomLoading());
      case TargetPlatform.iOS:
        return const Center(child: CustomLoading());
      default:
        return const Center(child: CustomLoading());
    }
  }
}
