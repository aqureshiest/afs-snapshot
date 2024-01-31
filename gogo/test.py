def build_test_command(base):
    def test_command(args):
        if args.test_method == 'watch':
            test_ci = base.build_command_func('docker-compose run --rm ci npx chassis-test-watch')
        elif args.test_method == 'debug':
            test_ci = base.build_command_func('docker-compose run --rm -e "TEST_OPTIONS=--inspect=0.0.0.0:9229" ci npx chassis-test-watch')
        else:
            test_ci = base.build_command_func('docker-compose run --rm ci npx chassis-test')
        test_ci(args)
    return test_command

def init_gadget(gobase):
    test_subparser = gobase.register_test(build_test_command(gobase))
    test_subparser.add_argument('test_method',
                                choices=['debug', 'watch'],
                                nargs='?',
                                help='help run the tests in a specific way')

