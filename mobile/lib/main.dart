import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'services/job_service.dart';
import 'screens/job_list_screen.dart';
import 'screens/login_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await Firebase.initializeApp();
  } catch (e) {
    debugPrint('Firebase initialization warning: $e');
  }
  runApp(const ImageTechnicianApp());
}

class ImageTechnicianApp extends StatelessWidget {
  const ImageTechnicianApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => JobService()),
      ],
      child: MaterialApp(
        title: 'Image Mobiles Tech',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF2563EB),
            primary: const Color(0xFF2563EB),
            secondary: const Color(0xFF10B981),
            surface: const Color(0xFF131B2E),
            brightness: Brightness.dark,
          ),
          scaffoldBackgroundColor: const Color(0xFF0B1222),
          appBarTheme: const AppBarTheme(
            elevation: 0,
            backgroundColor: Color(0xFF131B2E),
            foregroundColor: Colors.white,
          ),
          cardTheme: const CardThemeData(
            color: Color(0xFF131B2E),
            surfaceTintColor: Colors.transparent,
          ),
        ),
        home: Consumer<JobService>(
          builder: (context, jobService, _) {
            return jobService.isLoggedIn
                ? const JobListScreen()
                : const LoginScreen();
          },
        ),
      ),
    );
  }
}
