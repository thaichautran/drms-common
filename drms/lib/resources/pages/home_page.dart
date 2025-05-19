import 'package:vguider/app/models/dto/requests/login_dto.dart';
import 'package:vguider/app/models/kich_ban.dart';
import 'package:vguider/app/networking/map_api_service.dart';
import 'package:vguider/bootstrap/helpers.dart';
import 'package:vguider/config/keys.dart';
import 'package:vguider/resources/pages/direction_page.dart';

import '/app/controllers/home_controller.dart';
import 'package:flutter/material.dart';
import 'package:nylo_framework/nylo_framework.dart';

class HomePage extends NyStatefulWidget<HomeController> {
  static RouteView path = ("/home", (_) => HomePage());

  HomePage({super.key}) : super(child: () => _HomePageState());
}

class _HomePageState extends NyPage<HomePage> {
  List<KichBan>? _scenarios = [];
  MapApiService _mapApiService = MapApiService();
  @override
  get init => () async {
        Keys.bearerToken.deleteFromStorage();
        var res = await _mapApiService.login(
          LoginDTO("sa", "Abc@123456"),
        );
        await storageSave("token", res.data?.access_token);

        var res2 = await _mapApiService.getListKichBan();
        if (res2 != null) {
          _scenarios = res2.data;
        }
      };

  /// The [view] method displays your page.
  @override
  Widget view(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFEEF2FF),
      appBar: AppBar(
        elevation: 0,
        title: const Text(
          'Kịch bản ứng phó thiên tai',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        foregroundColor: ThemeColor.get(context).appBarBackground,
      ),
      body: Column(
        children: [
          // Gradient header card with total count
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(24),
                gradient: const LinearGradient(
                  colors: [
                    Color(0xFF7F00FF),
                    Color(0xFFE100FF),
                    Color(0xFF00B4D8),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                boxShadow: const [
                  BoxShadow(
                    blurRadius: 12,
                    color: Colors.black26,
                    offset: Offset(0, 6),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const Text(
                    'Tổng số kịch bản',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _scenarios!.length.toString(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 48,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              itemCount: _scenarios!.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final scenario = _scenarios![index];
                final colors = Colors.white;
                return InkWell(
                  onTap: () {},
                  child: Container(
                    decoration: BoxDecoration(
                      color: colors,
                      // gradient: LinearGradient(
                      //   colors: colors,
                      //   begin: Alignment.topLeft,
                      //   end: Alignment.bottomRight,
                      // ),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: const [
                        BoxShadow(
                          blurRadius: 8,
                          color: Colors.black26,
                          offset: Offset(0, 4),
                        ),
                      ],
                    ),
                    child: ListTile(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                      leading: const Icon(
                        Icons.shield_rounded,
                        size: 32,
                      ),
                      title: Text(
                        scenario.tenPhuongan ?? "-",
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),
                      subtitle: Text(
                        scenario.moTa ?? "-",
                      ),
                      trailing: const Icon(
                        Icons.chevron_right,
                      ),
                    ),
                  ).onTap(() =>
                      routeTo(DirectionPage.path, data: scenario.map?.id)),
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        shape: const StadiumBorder(),
        elevation: 6,
        onPressed: () {},
        child: const Icon(Icons.add),
      ),
    );
  }
}

/// Model representing a disaster‑response scenario
class DisasterScenario {
  final int id;
  final String title;
  final String description;

  DisasterScenario({
    required this.id,
    required this.title,
    required this.description,
  });
}

List<Color> _cardGradientColors(int index) {
  const palette = [
    [Color(0xFFFFA69E), Color(0xFFFF686B)],
    [Color(0xFFB8F2E6), Color(0xFF00B4D8)],
    [Color(0xFFFFD670), Color(0xFFFF9C6E)],
    [Color(0xFFC3B1E1), Color(0xFF8466AD)],
    [Color(0xFF9AEBA3), Color(0xFF41B883)],
  ];
  return palette[index % palette.length];
}

class DisasterScenarioService {
  static Future<List<DisasterScenario>> fetchScenarios() async {
    await Future.delayed(const Duration(milliseconds: 800));
    return [
      DisasterScenario(
        id: 1,
        title: 'Lũ quét miền núi phía Bắc',
        description: 'Kịch bản ứng phó khi mưa lớn gây lũ quét.',
      ),
      DisasterScenario(
        id: 2,
        title: 'Bão cấp 12 đổ bộ miền Trung',
        description: 'Kịch bản sơ tán khu ven biển và đảm bảo an toàn.',
      ),
      DisasterScenario(
        id: 3,
        title: 'Hạn hán đồng bằng sông Cửu Long',
        description: 'Kịch bản điều tiết nguồn nước khẩn cấp.',
      ),
    ];
  }
}

class AddScenarioPage extends StatelessWidget {
  const AddScenarioPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Thêm kịch bản')),
      body: const Center(
        child: Text(
          'TODO: Xây dựng giao diện thêm kịch bản',
          style: TextStyle(fontSize: 18),
        ),
      ),
    );
  }
}
