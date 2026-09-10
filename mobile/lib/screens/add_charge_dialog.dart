import 'package:flutter/material.dart';

class AddChargeDialog extends StatefulWidget {
  final Function(String title, double amount) onAdd;

  const AddChargeDialog({super.key, required this.onAdd});

  @override
  State<AddChargeDialog> createState() => _AddChargeDialogState();
}

class _AddChargeDialogState extends State<AddChargeDialog> {
  final _titleController = TextEditingController();
  final _amountController = TextEditingController();

  final List<Map<String, dynamic>> _quickPresets = [
    {'title': 'OLED Display Flex Cable', 'amount': 850.0},
    {'title': 'Battery OEM Replacement', 'amount': 1400.0},
    {'title': 'Type-C Charging Sub-board', 'amount': 650.0},
    {'title': 'Front Camera Glass & Seal', 'amount': 450.0},
  ];

  @override
  void dispose() {
    _titleController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  void _submit() {
    final title = _titleController.text.trim();
    final amount = double.tryParse(_amountController.text.trim()) ?? 0.0;

    if (title.isNotEmpty && amount > 0) {
      widget.onAdd(title, amount);
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: const Row(
        children: [
          Icon(Icons.add_circle_outline, color: Color(0xFF2563EB)),
          SizedBox(width: 8),
          Text('Add Spare Part / Labor', style: TextStyle(fontSize: 16)),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Quick Select:',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: _quickPresets.map((preset) {
                return ActionChip(
                  label: Text('${preset['title']} (₹${preset['amount'].toInt()})'),
                  labelStyle: const TextStyle(fontSize: 11),
                  onPressed: () {
                    setState(() {
                      _titleController.text = preset['title'] as String;
                      _amountController.text = (preset['amount'] as double).toInt().toString();
                    });
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: 'Part / Service Description',
                border: OutlineInputBorder(),
                isDense: true,
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Amount (₹)',
                prefixText: '₹ ',
                border: OutlineInputBorder(),
                isDense: true,
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF2563EB),
            foregroundColor: Colors.white,
          ),
          onPressed: _submit,
          child: const Text('Add & Notify Customer'),
        ),
      ],
    );
  }
}
