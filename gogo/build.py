def build_build_command(base):
    def build_command(args):
        if args.build_method == 'clean':
            return base.build_command_func('docker compose run --rm service npm run build:clean')(args)
        return base.build_command_func('docker compose run --rm service npm run build')(args)
    return build_command

def init_gadget(gobase):
    test_subparser = gobase.register_custom_child('build', 'Bundle application', build_build_command(gobase))

    test_subparser.add_argument('build_method',
            choices=['compile', 'clean'],
            nargs='?',
            help='Select build operation (default=compile)'
            )
