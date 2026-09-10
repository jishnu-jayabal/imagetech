import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/job_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  // Step 0: Phone Number Input | Step 1: OTP Verification
  int _step = 0;

  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _otpController = TextEditingController();

  final List<FocusNode> _otpFocusNodes = List.generate(6, (_) => FocusNode());
  final List<TextEditingController> _otpDigitControllers = List.generate(6, (_) => TextEditingController());

  Timer? _resendTimer;
  int _resendCountdown = 45;
  bool _canResend = false;

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    for (final f in _otpFocusNodes) {
      f.dispose();
    }
    for (final c in _otpDigitControllers) {
      c.dispose();
    }
    _resendTimer?.cancel();
    super.dispose();
  }

  void _startResendTimer() {
    _resendCountdown = 45;
    _canResend = false;
    _resendTimer?.cancel();
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      setState(() {
        if (_resendCountdown > 0) {
          _resendCountdown--;
        } else {
          _canResend = true;
          timer.cancel();
        }
      });
    });
  }

  String _formatPhoneNumber(String raw) {
    String clean = raw.replaceAll(RegExp(r'[^0-9]'), '');
    if (clean.startsWith('91') && clean.length > 10) {
      clean = clean.substring(2);
    }
    return '+91$clean';
  }

  Future<void> _handleSendOtp(JobService jobService) async {
    final rawPhone = _phoneController.text.trim();
    if (rawPhone.isEmpty || rawPhone.length < 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a valid 10-digit mobile number'),
          backgroundColor: Colors.redAccent,
        ),
      );
      return;
    }

    final formatted = _formatPhoneNumber(rawPhone);
    final success = await jobService.sendOtp(formatted);

    if (success && mounted) {
      setState(() {
        _step = 1;
      });
      _startResendTimer();
      _otpFocusNodes[0].requestFocus();
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: Colors.red.shade800,
          content: Text(jobService.authError ?? 'Could not send verification SMS'),
        ),
      );
    }
  }

  Future<void> _handleVerifyOtp(JobService jobService) async {
    final otp = _otpDigitControllers.map((c) => c.text).join().trim();
    if (otp.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter all 6 digits of the SMS code'),
          backgroundColor: Colors.redAccent,
        ),
      );
      return;
    }

    final formatted = _formatPhoneNumber(_phoneController.text.trim());
    final success = await jobService.verifyOtp(otp, formatted);

    if (!success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: Colors.red.shade800,
          content: Text(jobService.authError ?? 'Invalid or expired OTP code'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final jobService = context.watch<JobService>();

    return Scaffold(
      backgroundColor: const Color(0xFF0B1222),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // App Brand Logo
                  Center(
                    child: Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF2563EB), Color(0xFF38BDF8)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF2563EB).withValues(alpha: 0.45),
                            blurRadius: 24,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.handyman_rounded,
                        color: Colors.white,
                        size: 38,
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Brand Titles
                  const Text(
                    'Image Mobiles',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Technician Dispatch & Live Tracking Portal',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 13,
                      color: Color(0xFF94A3B8),
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Form Container Card
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: const Color(0xFF131B2E),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: const Color(0xFF2A374F),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.4),
                          blurRadius: 30,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: (_step == 1 || jobService.currentVerificationId != null)
                        ? _buildOtpStep(context, jobService)
                        : _buildPhoneStep(context, jobService),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  // --- STEP 1: PHONE NUMBER INPUT ---
  Widget _buildPhoneStep(BuildContext context, JobService jobService) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Row(
          children: [
            Icon(Icons.phone_android_rounded, color: Color(0xFF38BDF8), size: 20),
            SizedBox(width: 8),
            Text(
              'Firebase Phone Authentication',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        const Text(
          'Enter your registered technician mobile number to receive a 6-digit SMS verification code.',
          style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
        ),
        const SizedBox(height: 16),

        if (jobService.authError != null) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF7F1D1D).withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFEF4444)),
            ),
            child: Row(
              children: [
                const Icon(Icons.gpp_bad_outlined, color: Color(0xFFF87171), size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    jobService.authError!,
                    style: const TextStyle(fontSize: 12, color: Color(0xFFFECACA), fontWeight: FontWeight.w500),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],

        // Phone Input with +91 Country Code
        const Text(
          'Mobile Number',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: Color(0xFFCBD5E1),
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF2A374F)),
              ),
              child: const Row(
                children: [
                  Text('🇮🇳', style: TextStyle(fontSize: 18)),
                  SizedBox(width: 6),
                  Text(
                    '+91',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: TextField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600),
                decoration: InputDecoration(
                  hintText: 'Enter 10-digit mobile number',
                  hintStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 14),
                  filled: true,
                  fillColor: const Color(0xFF0F172A),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFF2A374F)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFF2A374F)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFF38BDF8), width: 1.5),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),

        // Send OTP Button
        ElevatedButton(
          onPressed: jobService.isLoading ? null : () => _handleSendOtp(jobService),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF2563EB),
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            elevation: 0,
          ),
          child: jobService.isLoading
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                )
              : const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Send Verification SMS',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                    ),
                    SizedBox(width: 8),
                    Icon(Icons.arrow_forward_rounded, size: 18),
                  ],
                ),
        ),
      ],
    );
  }

  // --- STEP 2: OTP VERIFICATION ---
  Widget _buildOtpStep(BuildContext context, JobService jobService) {
    final phone = _formatPhoneNumber(_phoneController.text.trim());

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Row(
              children: [
                Icon(Icons.sms_outlined, color: Color(0xFF10B981), size: 20),
                SizedBox(width: 8),
                Text(
                  'Verify OTP Code',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
            TextButton.icon(
              onPressed: () {
                jobService.resetOtp();
                setState(() => _step = 0);
              },
              icon: const Icon(Icons.edit, size: 14, color: Color(0xFF38BDF8)),
              label: const Text(
                'Edit Phone',
                style: TextStyle(fontSize: 12, color: Color(0xFF38BDF8)),
              ),
              style: TextButton.styleFrom(padding: EdgeInsets.zero),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Text(
          'Enter the 6-digit SMS code sent to $phone',
          style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
        ),
        const SizedBox(height: 24),

        // 6 Digit PIN Boxes
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(6, (index) {
            return SizedBox(
              width: 44,
              height: 52,
              child: TextField(
                controller: _otpDigitControllers[index],
                focusNode: _otpFocusNodes[index],
                keyboardType: TextInputType.number,
                textAlign: TextAlign.center,
                maxLength: 1,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
                decoration: InputDecoration(
                  counterText: '',
                  filled: true,
                  fillColor: const Color(0xFF0F172A),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: Color(0xFF2A374F)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: Color(0xFF2A374F)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: Color(0xFF10B981), width: 2),
                  ),
                  contentPadding: EdgeInsets.zero,
                ),
                onChanged: (value) {
                  if (value.isNotEmpty && index < 5) {
                    _otpFocusNodes[index + 1].requestFocus();
                  } else if (value.isEmpty && index > 0) {
                    _otpFocusNodes[index - 1].requestFocus();
                  }
                  if (_otpDigitControllers.every((c) => c.text.isNotEmpty)) {
                    _handleVerifyOtp(jobService);
                  }
                },
              ),
            );
          }),
        ),
        const SizedBox(height: 20),

        // Resend Timer Row
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (!_canResend)
              Text(
                'Resend code in ${_resendCountdown}s',
                style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
              )
            else
              TextButton(
                onPressed: jobService.isLoading ? null : () => _handleSendOtp(jobService),
                child: const Text(
                  'Resend SMS Code',
                  style: TextStyle(
                    color: Color(0xFF38BDF8),
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 16),

        // Verify Button
        ElevatedButton(
          onPressed: jobService.isLoading ? null : () => _handleVerifyOtp(jobService),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF10B981),
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            elevation: 0,
          ),
          child: jobService.isLoading
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                )
              : const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Verify & Open Field App',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                    ),
                    SizedBox(width: 8),
                    Icon(Icons.check_circle_outline, size: 18),
                  ],
                ),
        ),
      ],
    );
  }
}
