# libs in alphabetical order
import datetime
import json
import os
import subprocess

# variables that are global
description = 'Go script for apply-flow-service'
service_name = 'apply-flow-service'
service_image_name = f"earnest/{service_name}"
package_json_location = os.path.join(os.getcwd(), 'package.json')


# Functions here
def get_version():
    if os.getenv('VERSION') is not None:
        return os.getenv('VERSION')
    else:
        return 'localdev'


def version_package_json_file(location, version):
    original_json_dict = read_package_json_file(location)
    modified_json_dict = version_package_json_dict(version, original_json_dict)
    write_package_json_file(package_json_location, modified_json_dict)


def read_package_json_file(package_json_file):
    with open(package_json_file, 'r') as file:
        return json.load(file)


def write_package_json_file(location, package_json_dict):
    with open(location, 'w') as file :
        file.write(json.dumps(package_json_dict))


def version_package_json_dict(version, package_json_python_dict):
    package_json_python_dict['build'] = version
    return package_json_python_dict


def build_version_command(base):
    def version_command(args):
        if args.asset == 'package-json':
            version_package_json_file(package_json_location, get_version())
            exit(0)
        elif args.asset == 'all':
            version_package_json_file(package_json_location, get_version())

        version_image = base.build_command_func(f"docker tag {service_image_name} {service_image_name}:{get_version()}")
        version_image(args)
    return version_command

def build_npm_command(base):
    def npm_command(args):
        subprocess.call(['docker-compose','run','dev','npm'] + args.npm_args)
    return npm_command

def init_gadget(gobase):
    # Basic commands
    gobase.register_start('docker-compose up dev')
    gobase.register_stop()
    gobase.register_clean('docker-compose down --volumes')
    gobase.register_shell()
    gobase.register_lint_jenkinsfile()
    gobase.register_login_npm()

    npm_subparser = gobase.register_custom_child('npm', 'run npm in the docker container', build_npm_command(gobase))
    npm_subparser.add_argument('npm_args', nargs='+', help='help run npm in a specific way')

    version_subparser = gobase.register_custom_child('version', 'version the image built for this service', build_version_command(gobase))
    version_subparser.add_argument('asset',
                                   choices=['all', 'package-json', 'image'],
                                   default='all',
                                   nargs='?',
                                   help='version assets of the service')

    # Override default init command
    gobase.register_init('docker-compose build dev')
