module.exports = function(fileInfo, api) {
    const j = api.jscodeshift;
    const root = j(fileInfo.source);
    let hasNodeTest = false;

    root.find(j.ImportDeclaration, {
        source: { value: 'node:test' }
    }).forEach(path => {
        hasNodeTest = true;
        path.node.source.value = 'vitest';

        const specifiers = path.node.specifiers.filter(specifier => {
            return specifier.imported && specifier.imported.name !== 'mock';
        });

        const hasVi = specifiers.some(s => s.imported && s.imported.name === 'vi');
        if (!hasVi) {
            specifiers.push(j.importSpecifier(j.identifier('vi')));
        }

        path.node.specifiers = specifiers;
    });

    if (!hasNodeTest) {
        return root.toSource();
    }

    root.find(j.CallExpression, {
        callee: {
            type: 'MemberExpression',
            object: { name: 'mock' },
            property: { name: 'fn' }
        }
    }).forEach(path => {
        path.node.callee.object.name = 'vi';
    });

    return root.toSource();
};
