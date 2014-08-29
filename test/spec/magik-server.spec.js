describe('magik-server unit tests', function () {

    var path = require('path'),
        root = process.env.PWD,
        filePath = path.resolve(root, 'lib/magik-server'),
        magikServer = require(filePath);

    it('should pass this test', function(){
        expect(true).toBe(true);
    });

    it('should load the magik-server code', function(){
        expect(typeof magikServer).toBe('object');
    });

    describe('test setting config options', function () {

        beforeEach(function(){
            var configuredOptions = {},
                config = require(path.resolve(filePath, 'config.js'));
        });

        it('should load the config module', function(){
            //expect(typeof config).toBe('Object');
        });
    });

});
