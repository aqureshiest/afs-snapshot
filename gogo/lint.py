def build_lint_command(base):
    def lint_command(args):
        if args.lint_command == 'types':
            return base.build_command_func('docker-compose run --rm --no-deps ci npm run build:check')(args)
        if args.lint_command == 'fix':
            return base.build_command_func('docker-compose run --rm --no-deps ci npm run lint:fix')(args)
        if args.lint_command == 'prettify':
            return base.build_command_func('docker-compose run --rm --no-deps ci npm run lint:prettify')(args)
        return base.build_command_func('docker-compose run --rm --no-deps ci npm run lint')(args)
    return lint_command

def init_gadget(gobase):
    lint_subparser = gobase.register_custom_child('lint', 'Run the linter', build_lint_command(gobase))

    lint_subparser.add_argument('lint_command',
            choices=['types', 'fix', 'prettify'],
            nargs='?',
            help='Run linting scripts'
            )

