"""
Unit tests for add_todos.py

Tests the add_todo_to_file function behavior:
- Prepends '// TODO: Review this file' to .js/.jsx files
- Is idempotent (does not add multiple TODOs on repeated runs)
- Handles file read/write errors gracefully
"""
import os
import sys
import tempfile
import unittest
import importlib.util


def load_add_todo_function():
    """Load add_todo_to_file from add_todos.py without executing the os.walk block."""
    repo_root = os.path.join(os.path.dirname(__file__), '..')
    script_path = os.path.abspath(os.path.join(repo_root, 'add_todos.py'))

    spec = importlib.util.spec_from_file_location('add_todos', script_path)
    module = importlib.util.module_from_spec(spec)

    # Patch os.walk to prevent the module-level walk from touching real files
    import unittest.mock as mock
    with mock.patch('os.walk', return_value=iter([])):
        spec.loader.exec_module(module)

    return module.add_todo_to_file


add_todo_to_file = load_add_todo_function()


class TestAddTodoToFile(unittest.TestCase):

    def setUp(self):
        self.tmpdir = tempfile.mkdtemp()

    def tearDown(self):
        import shutil
        shutil.rmtree(self.tmpdir, ignore_errors=True)

    def _write_file(self, filename, content):
        path = os.path.join(self.tmpdir, filename)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        return path

    def _read_file(self, path):
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()

    # --- Prepend behaviour ---

    def test_prepends_todo_comment_to_file(self):
        path = self._write_file('test.js', 'import React from "react"\n')
        add_todo_to_file(path)
        content = self._read_file(path)
        self.assertTrue(content.startswith('// TODO: Review this file\n'))

    def test_original_content_preserved_after_prepend(self):
        original = 'import React from "react"\n'
        path = self._write_file('test.js', original)
        add_todo_to_file(path)
        content = self._read_file(path)
        self.assertIn(original, content)

    def test_todo_comment_is_exact_text(self):
        path = self._write_file('component.jsx', 'export default function App() {}\n')
        add_todo_to_file(path)
        content = self._read_file(path)
        self.assertEqual(
            content,
            '// TODO: Review this file\nexport default function App() {}\n'
        )

    def test_works_with_empty_file(self):
        path = self._write_file('empty.js', '')
        add_todo_to_file(path)
        content = self._read_file(path)
        self.assertEqual(content, '// TODO: Review this file\n')

    def test_works_with_multiline_file(self):
        original = 'line1\nline2\nline3\n'
        path = self._write_file('multi.js', original)
        add_todo_to_file(path)
        content = self._read_file(path)
        self.assertEqual(content, '// TODO: Review this file\n' + original)

    # --- Idempotency ---

    def test_does_not_add_second_todo_when_already_present(self):
        path = self._write_file(
            'already.js', '// TODO: Review this file\nimport x from "x"\n'
        )
        add_todo_to_file(path)
        content = self._read_file(path)
        # Should only appear once
        self.assertEqual(content.count('// TODO: Review this file'), 1)

    def test_running_twice_is_idempotent(self):
        path = self._write_file('test.js', 'const x = 1\n')
        add_todo_to_file(path)
        first_result = self._read_file(path)
        add_todo_to_file(path)
        second_result = self._read_file(path)
        self.assertEqual(first_result, second_result)

    def test_does_not_modify_file_already_starting_with_todo(self):
        original = '// TODO: Review this file\nconst x = 1\n'
        path = self._write_file('test.js', original)
        add_todo_to_file(path)
        content = self._read_file(path)
        self.assertEqual(content, original)

    # --- Error handling ---

    def test_does_not_raise_on_nonexistent_file(self):
        nonexistent = os.path.join(self.tmpdir, 'does_not_exist.js')
        # Should handle the exception internally without raising
        try:
            add_todo_to_file(nonexistent)
        except Exception:
            self.fail('add_todo_to_file raised an exception on a missing file')

    def test_prints_error_message_for_unreadable_file(self, ):
        """Error messages are printed but not raised."""
        nonexistent = os.path.join(self.tmpdir, 'ghost.js')
        import io
        from contextlib import redirect_stdout
        output = io.StringIO()
        with redirect_stdout(output):
            add_todo_to_file(nonexistent)
        printed = output.getvalue()
        self.assertIn('Error processing', printed)

    # --- Edge cases ---

    def test_todo_check_is_prefix_match_not_substring(self):
        """A file whose content contains // TODO: but not at the start gets the comment prepended."""
        original = 'const x = 1\n// TODO: Review this file\n'
        path = self._write_file('mid.js', original)
        add_todo_to_file(path)
        content = self._read_file(path)
        # The TODO was not at the start so it gets prepended
        self.assertTrue(content.startswith('// TODO: Review this file\n'))
        self.assertEqual(content.count('// TODO: Review this file'), 2)

    def test_file_with_windows_line_endings_gets_todo_prepended(self):
        original = 'const x = 1\r\n'
        path = self._write_file('windows.js', original)
        add_todo_to_file(path)
        content = self._read_file(path)
        self.assertTrue(content.startswith('// TODO: Review this file\n'))

    def test_utf8_content_is_preserved(self):
        original = '// Ä ö ü — Unicode content\nconst x = 1\n'
        path = self._write_file('unicode.js', original)
        add_todo_to_file(path)
        content = self._read_file(path)
        self.assertIn('Ä ö ü', content)
        self.assertTrue(content.startswith('// TODO: Review this file\n'))


if __name__ == '__main__':
    unittest.main()