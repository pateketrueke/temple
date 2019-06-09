    path = require('path')

    describe 'bundling support', ->
      it 'should bundle scripts', (done) ->
        view = tarima('a.js')
        view.bundle (err, result) ->
          expect(err).toBeUndefined()
          expect(result.source).toContain '<h1>It works!</h1>"'
          expect(result.source).toContain 'function template'
          expect(result.source).toContain '[x, template]'
          expect(result.source).toContain 'runtime'
          done()

      it 'should skip non-scripts', (done) ->
        view = tarima('x.pug', 'h1 #{x}')
        view.bundle { x: 'It works!' }, (err, result) ->
          expect(err).toBeUndefined()
          expect(result.source).toContain '<h1>It works!</h1>'
          done()

    describe 'Rollup.js integration', ->
      it 'should bundle modules', (done) ->
        tarima('module_a.litcoffee')
        .bundle (err, result) ->
          expect(err).toBeUndefined()
          expect(result.deps).toContain path.resolve(__dirname, 'fixtures/bar.yml')
          expect(result.deps).toContain path.resolve(__dirname, 'fixtures/module_b.js')

          expect(result.source).toMatch /var b.* = 'x'/
          done()

      it 'should bundle commonjs sources through plugins', (done) ->
        tarima('entry.js', rollup: {
          onwarn: (warning) ->
            return if warning.code is 'MISSING_EXPORT'
            return if warning.code is 'MIXED_EXPORTS'
            console.log warning.message
          plugins:
            'rollup-plugin-node-resolve':
              mainFields: ['js:next', 'main', 'module', 'browser']
              preferBuiltins: false
            'rollup-plugin-commonjs':
              include: ['node_modules/**', '**/*.js']
        }).bundle (err, result) ->
          expect(err).toBeUndefined()
          expect(result.source).toContain 'exports.default = entry'
          done()

      it 'should bundle remote dependencies', (done) ->
        tarima('remote.js').bundle (err, result) ->
          expect(err).toBeUndefined()
          expect(result.source).toContain 'function noop'
          expect(result.source).toContain 'console.log(createElement)'
          done()
