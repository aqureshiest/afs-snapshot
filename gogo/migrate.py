import datetime
import os
import subprocess

# Functions here
def get_version():
    if os.getenv('VERSION') is not None:
        return os.getenv('VERSION')
    else:
        return 'localdev'
def migrate(args):
    env = os.environ.copy()
    env["VERSION"] = get_version()
    return subprocess.call(["docker-compose", "run", "schema"], env=env)

def create_migration(args):
    now = datetime.datetime.now().strftime("%Y%m%d%H%M%S")[0:14]
    open("schema/sql/V{}__{}.sql".format(
        now,
        args.migration_name), 'a').close()
    update_latest_migration()

def update_latest_migration():
    os.popen('(ls schema/sql | tail -n 1) > schema/latest')

def init_gadget(gobase):
    gobase.register_custom_child('migrate', 'Execute schema migration locally', migrate)
    create_migration_subparser = gobase.register_custom_child('create-migration', 'Create a new migration with the given name at the current timestamp', create_migration)
    create_migration_subparser.add_argument('migration_name')
