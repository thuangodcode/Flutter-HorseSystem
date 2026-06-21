import 'dart:io';

void main() {
  final dir = Directory('lib/screens');
  final files = dir.listSync().whereType<File>().where((f) => f.path.endsWith('.dart'));

  for (final file in files) {
    String content = file.readAsStringSync();
    
    bool changed = false;
    
    if (content.contains('padding: const EdgeInsets.all(20),')) {
      content = content.replaceAll(
        'padding: const EdgeInsets.all(20),', 
        'padding: const EdgeInsets.fromLTRB(20, 20, 20, 120),'
      );
      changed = true;
    }
    
    if (content.contains('padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),')) {
      content = content.replaceAll(
        'padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),', 
        'padding: const EdgeInsets.fromLTRB(20, 8, 20, 120),'
      );
      changed = true;
    }

    if (changed) {
      file.writeAsStringSync(content);
      print('Updated ${file.path}');
    }
  }
}
